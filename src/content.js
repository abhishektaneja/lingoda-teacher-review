const cssClasses = {
    textStyleSecondary: 'MuiTypography-root MuiTypography-body1 css-l0jbfn',
    textStyle: 'MuiTypography-root MuiTypography-overline css-159wzko',
    buttonStyle: 'MuiButtonBase-root MuiButton-outlinedSizeSmall MuiButton-disableElevation css-to0fd0',
};

// Utility function to wait for elements to appear
function waitForElement(main, selector, callback) {
    const observer = new MutationObserver((mutations, me) => {
        const element = main.querySelector(selector);
        if (element) {
            callback(element);
            me.disconnect(); // Stop observing once the element is found
        }
    });

    observer.observe(main, {
        childList: true,
        subtree: true
    });
}

// Get cleaned-up teacher name
function getTeacherName(teacherNameElement) {
    return teacherNameElement.innerText.toLowerCase().replace(/(group class by |group class with )/g, "");
}

// Save or update review in chrome storage
async function saveReview(teacherName, rating, note) {
    try {
        await chrome.storage.local.set({[teacherName]: {rating, note}});
        console.log(`Review saved for ${teacherName}`);
    } catch (err) {
        console.error(`Failed to save review for ${teacherName}`, err);
    }
}

// Fetch review from chrome storage
async function getReview(teacherName) {
    return new Promise((resolve) => {
        chrome.storage.local.get([teacherName], (result) => {
            resolve(result[teacherName] || null);
        });
    });
}

// Function to create and append the review form
function appendReviewForm(classDetails, teacherName, cssClasses) {
    let btnClass = "css-yz1oy9"
    const btn = classDetails.querySelector("button")
    if (btn) {
        btnClass = classDetails.querySelector("button").className
    }
    const reviewForm = document.createElement('div');
    reviewForm.innerHTML = `
        <h4>Rate this class</h4>
        <label class="${cssClasses.textStyle}">Rating:</label>
        <input type="number" min="1" max="5" id="classRating" />
        <br/><br/><label class="${cssClasses.textStyle}">Note:</label>
        <textarea id="classNote"></textarea>
        <br/><br/><button class="${btnClass} ${cssClasses.textStyleSecondary}" id="submitReview">Submit Review</button>
    `;

    classDetails.appendChild(reviewForm);

    getReview(teacherName).then((review) => {
        if (review) {
            document.getElementById('classRating').value = review.rating || '';
            document.getElementById('classNote').value = review.note || '';
        }
    });

    document.getElementById('submitReview').addEventListener('click', () => {
        const rating = document.getElementById('classRating').value;
        const note = document.getElementById('classNote').value;
        saveReview(teacherName, rating, note).then(() => {
            alert(`Review saved for ${teacherName}`);
        });
    });
}

// Function to create and append the review display on the booking page
async function appendReviewDisplay(classInfoDiv, teacherName) {
    const teacherDiv = document.createElement('div');
    teacherDiv.classList.add('review-appended')
    const review = await getReview(teacherName);

    if (review) {
        console.log(`Review found for ${teacherName}:`, review);
        teacherDiv.innerHTML = `
            <div class="${cssClasses.textStyle}">Review: ${review.rating}/5</div>
            <button class="viewNote ${cssClasses.buttonStyle}">View Note</button>
        `;
        // Append the review display only if it hasn’t been added before
        if (!classInfoDiv.querySelector('.review-appended')) {
            classInfoDiv.appendChild(teacherDiv);
        }

        teacherDiv.querySelector('.viewNote').addEventListener('click', (e) => {
            e.preventDefault();
            openModal(review);
        });
    } else {
        console.log(`No review found for ${teacherName}`);
    }
}

// Simple modal for displaying notes
function openModal(review) {
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.backgroundColor = '#fff';
    modal.style.padding = '20px';
    modal.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
    modal.innerHTML = `
        <h4>Note</h4>
        <div class="${cssClasses.textStyle}">Review: ${review.rating}/5</div>
        <div class="${cssClasses.textStyle}">${review.note}</div>
        <button class="${cssClasses.buttonStyle}" id="closeModal">Close</button>
    `;

    document.body.appendChild(modal);

    document.getElementById('closeModal').addEventListener('click', () => {
        modal.remove();
    });
}

// Main Logic for Class Details Page
if (window.location.href.includes('/class/details')) {
    const classDetailsSection = '.css-19kzrtu';
    const teacherNameSection = '.css-1k7cv3t';
    const cssClasses = {
        textStyle: 'MuiTypography-root MuiTypography-overline css-159wzko',
        textStyleSecondary: 'MuiTypography-root MuiTypography-body1 css-l0jbfn',
    };

    waitForElement(document, classDetailsSection, (classDetails) => {
        const teacherNameElement = classDetails.querySelector(teacherNameSection);
        const teacherName = getTeacherName(teacherNameElement);
        appendReviewForm(classDetails, teacherName, cssClasses);
    });
}

// Utility function to handle dynamic elements
function observeTeacherList(teacherListSelector, teacherInfoSelector, onTeacherFound) {
    const teacherList = document.querySelector(teacherListSelector);

    if (!teacherList) {
        // console.warn(`No teacher list found with selector: ${teacherListSelector}`);
        return;
    }

    const observer = new MutationObserver((mutations) => {
        document.querySelectorAll(teacherListSelector).forEach((teacher) => {
            const teacherInfoElement = teacher.querySelector(teacherInfoSelector);
            if (teacherInfoElement) {
                const teacherName = getTeacherName(teacherInfoElement);

                // Check if the teacher already has a review appended
                if (!teacher.querySelector('.review-appended')) {
                    onTeacherFound(teacher, teacherName);
                }
            }
        });
    });

    // Observe the teacher list for changes (e.g., new teachers or updates)
    observer.observe(teacherList, {
        childList: true,
        subtree: true
    });
}


// Main logic for the booking page
if (window.location.href.includes('/account/booking')) {
    const classesWrapperParentClassName = '.css-kzs7ph';
    const classesWrapperClassName = `.css-j7qwjs > .box.display-block`;
    const teacherClassInfoClassName = '.css-rdg5qz .css-16biaea .css-1wxaqej .css-1gbo16e .css-1wxaqej .css-1wkwmmc .css-1wxaqej';
    const classNameElement = `${classesWrapperClassName} ${teacherClassInfoClassName}`

    // Function to handle processing of each teacher element
    function processTeachers() {
        document.querySelectorAll(classNameElement).forEach(ele => {
            const classInfoDiv = ele.parentElement;
            const teacherName = getTeacherName(ele);
            if (teacherName !== "" && teacherName !== "group class" && teacherName !== "teacher will be assigned") {
                appendReviewDisplay(classInfoDiv, teacherName);
            }
        });
    }

    waitForElement(document, classesWrapperClassName, () => {
        document.querySelectorAll(classesWrapperClassName).forEach((teacher) => {
            waitForElement(teacher, teacherClassInfoClassName, () => {
                waitForElement(document, classNameElement, () => {
                    processTeachers()
                })
            });
        });

        // Set up a MutationObserver to monitor any changes in the classes wrapper
        const classesWrapper = document.querySelector(classesWrapperParentClassName);
        if (classesWrapper) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach(() => {
                    processTeachers();
                });
            });

            observer.observe(classesWrapper, {
                childList: true,
                subtree: true
            });
        }
    });
}