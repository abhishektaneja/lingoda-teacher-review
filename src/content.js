
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
function getTeacherName(element) {
    const translations = {
        en: ["group class with ", "group class by "],
        de: ["gruppenstunde mit "],
        es: ["clase de grupo con "],
        fr: ["cours en groupe avec ", "Cours en groupe de "],
        ru: ["групповой урок с "]
    };

    let original = element.innerText.toLowerCase()
    let name = element.innerText.toLowerCase();

    // Flatten all translations into a single array
    const phrases = Object.values(translations).flat();
    console.log(phrases)

    // Replace all matching phrases
    phrases.forEach(phrase => {
        name = name.replace(new RegExp(`(${phrase})`, "gi"), "");
    });

    if (original === name) {
        return ""
    }
    return name.trim();
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
function appendReviewForm(classDetails, teacherName) {
    let btnClass = "css-yz1oy9"
    const btn = classDetails.querySelector("button")
    const reviewForm = document.createElement('div');
    reviewForm.innerHTML = `
        <div class="review_form_wrapper">
            <h4 class="text_title">Rate this class</h4>
            <div class="form-row">
                <div class="form-column label-column">
                    <label class="text_secondary">Rating:</label>
                </div>
                <div class="form-column input-column">
                    <input class="text_secondary" type="number" min="1" max="5" id="classRating" />
                </div>
            </div>
            <div class="form-row">
                <div class="form-column label-column">
                    <label class="text_secondary">Note:</label>
                </div>
                <div class="form-column input-column">
                    <textarea class="text_secondary" id="classNote"></textarea>
                </div>
            </div>
            <div class="form-row">
                <div class="form-column input-column">
                    <button class="btn_submit_review text_secondary" id="submitReview">Submit Review</button>
                </div>
            </div>
        </div>
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

// Function to convert rating number to stars
function getStarRating(reviewRating) {
    const rating = Math.max(1, Math.min(5, reviewRating))
    const fullStar = '★';  // Full star symbol
    const emptyStar = '☆'; // Empty star symbol
    let stars = '';

    for (let i = 1; i <= 5; i++) {
        stars += i <= rating ? fullStar : emptyStar;
    }

    return stars;
}


// Function to create and append the review display on the booking page
async function appendReviewDisplay(classInfoDiv, teacherName) {
    const teacherDiv = document.createElement('div');
    teacherDiv.classList.add('review-appended')
    const review = await getReview(teacherName);
    let stars
    if (review) {
        console.log(`Review found for ${teacherName}:`, review);
        stars = getStarRating(review.rating);
    }else {
        stars = `No review available for ${teacherName}`
    }
    teacherDiv.innerHTML = `
        <div class="text_secondary">${stars}</div>
    `;
    if(review){
        teacherDiv.innerHTML += `
           <button class="viewNote btn_view_review">View Review</button>
        `;
    }
    if (!classInfoDiv.querySelector('.review-appended')) {
        classInfoDiv.appendChild(teacherDiv);
    }

    if (teacherDiv.querySelector('.viewNote')) {
        teacherDiv.querySelector('.viewNote').addEventListener('click', (e) => {
            e.preventDefault();
            openModal(review);
        });
    }
}

// Simple modal for displaying notes
function openModal(review) {
    const modal = document.createElement('div');
    let stars = getStarRating(review.rating);
    modal.style.position = 'fixed';
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.backgroundColor = '#fff';
    modal.style.padding = '20px';
    modal.style.zIndex = '9999';
    modal.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
    modal.innerHTML = `
        <h4>Review</h4>
        <div class="text_secondary">${stars}</div>
        <br />
        <div class="text_secondary">${review.note}</div>
        <br />
        <button class="text_secondary btn_view_review" id="closeModal">Close</button>
    `;

    document.body.appendChild(modal);

    document.getElementById('closeModal').addEventListener('click', () => {
        modal.remove();
    });
}

function main() {
    // Main Logic for Class Details Page
    if (window.location.href.includes('/class/details')) {
        const classDetailsSection = '[data-cy="Class details tile"]';
        const teacherNameSection = 'h3';

        waitForElement(document, classDetailsSection, (classDetails) => {
            const teacherNameElement = classDetails.querySelector(teacherNameSection);
            const teacherName = getTeacherName(teacherNameElement);
            appendReviewForm(classDetails, teacherName);
        });
    }

// Main logic for the booking page
    if (window.location.href.includes('/account/booking')) {
        const classTypeInfos = '[data-cy="classInfo_classTypeInfo"]'
        const availableClasses = '[data-cy="Available classes"]'
        // Function to handle processing of each teacher element
        async function processTeachers() {
            for (const ele of document.querySelectorAll(`${classTypeInfos}`)) {
                const classInfoDiv = ele.parentElement.parentElement;
                if (classInfoDiv.querySelector('.review-appended')) {
                    continue;
                }
                const teacherName = getTeacherName(ele);
                if (teacherName !== "" && teacherName !== "group class" && teacherName !== "teacher will be assigned") {
                    await appendReviewDisplay(classInfoDiv, teacherName);
                }
            }
        }

        waitForElement(document, classTypeInfos, async () => {
            await processTeachers()

            // Set up a MutationObserver to monitor any changes in the classes wrapper
            const classesWrapper = document.querySelector(availableClasses);
            if (availableClasses) {
                const observer = new MutationObserver(async (mutations) => {
                    await processTeachers();
                });

                observer.observe(classesWrapper, {
                    childList: true,
                    subtree: true
                });
            }
        });
    }
}

// Observe URL changes in single-page application
let lastUrl = location.href;

function observeUrlChanges() {
    const observer = new MutationObserver(() => {
        const currentUrl = location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            console.log(`%${currentUrl} != ${lastUrl}`);
            main();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

// Initial run
main();
observeUrlChanges();