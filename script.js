
var titleElement;

var wordsAtATime = 5;
var wordIndex = 0;
var locationName = "splitBook";

var wordInterval = 500;

var isPlaying = false;

var selectedBook = "No Book Selected";
var pastBooks = {};

var wpm = 500;


var speedSlider;

var speedValueDisplay;

var wordSlider;
var wordValueDisplay;
var avgCharsPerWord = 6;




var loadedBook;
var sortedBook = [];

document.addEventListener('DOMContentLoaded', (event) => {
    console.log("DOM fully loaded and parsed");


    titleElement = document.getElementById('bookTitle');


    // Add an event listener to the document
    document.addEventListener('keydown', keyPressed);

    // Call adjustFontSize initially and on window resize
    adjustFontSize();
    window.addEventListener('resize', adjustFontSize);









        // For speed slider
    speedSlider = document.getElementById("speedSlider");

    // Get the value display element
    speedValueDisplay = document.getElementById("speedValue");

    // Initial display of the slider value
    speedValueDisplay.textContent = speedSlider.value;


    speedSlider.addEventListener("input", function() {
        speedValueDisplay.textContent = speedSlider.value;
        let modifiedSpeed = speedSlider.value;
        wpm = modifiedSpeed;
        wordInterval = (60000 / wpm) * wordsAtATime;
        updateSlideDisplay();
    });

    // For word slider
    wordSlider = document.getElementById("wordSlider");
    wordValueDisplay = document.getElementById("wordValue");

    // Initial display of the slider value
    wordValueDisplay.textContent = wordSlider.value;

    wordSlider.addEventListener("input", function() {
        wordValueDisplay.textContent = wordSlider.value;
        let modifiedWords = wordSlider.value;
        let num = parseInt(modifiedWords);
        wordsAtATime = num;
        wordInterval = (60000 / wpm) * wordsAtATime;
        updateSlideDisplay();
    });


    document.getElementById('file-input').addEventListener('change', function(event) {
        console.log("recieved file");
        
        const file = event.target.files[0];
        if (file.type !== 'application/pdf') {
            alert('Please select a PDF file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const typedArray = new Uint8Array(e.target.result);
            console.log(typedArray);
            
            displayCoverPage(typedArray);

            pdfjsLib.getDocument(typedArray).promise.then(function(pdf) {
                
                
                
                let textContent = '';

                const numPages = pdf.numPages;
                let pagePromises = [];

                for (let pageNum = 1; pageNum <= numPages; pagePromises.push(pdf.getPage(pageNum)), pageNum++);

                Promise.all(pagePromises).then(pages => {
                    let textPromises = [];

                    for (let page of pages) {
                        textPromises.push(page.getTextContent().then(function(textContent) {
                            return textContent.items.map(function(item) {
                                return item.str;
                            }).join(' ');
                        }));
                    }

                    Promise.all(textPromises).then(texts => {
                        textContent = texts.join(' ');
                        
                        console.log(texts);
                        console.log(textContent);


                        let strArray = textContent;
                        sessionStorage.setItem(locationName, JSON.stringify(strArray));
                        
                        updateWordsAtATime();


                    });
                });
            });

            
            
        };

        reader.readAsArrayBuffer(file);

        wordIndex = 0;

        
    });

});


function updateWordsAtATime()
{
    // Retrieving the array
    loadedBook = JSON.parse(sessionStorage.getItem(locationName));
    console.log(loadedBook);

    var charsPerLine = wordsAtATime * avgCharsPerWord;
    console.log(charsPerLine);

    var tempBook = loadedBook.split(/\s+/);
    console.log(tempBook);
    sortedBook = [];

    var currentString = "";

    // handling each word in the book
    tempBook.forEach(function(word) {
    

        if (currentString.length + word.length < charsPerLine)
        {
            currentString = currentString + " " + word;
            
        }
        else 
        {
            sortedBook.push(currentString);
            currentString = word + " ";
        }

    });

    // handling last string
    if (currentString != "")
    {
        sortedBook.push(currentString);
        
    }


    loadWords();  
    updatePlaceSlider();
    
}

function displayCoverPage(pdfData) {
        
    const input = document.getElementById('file-input');
    selectedBook = input.files[0].name;
    
    let titleElement = document.getElementById("bookTitle");
    titleElement.textContent = selectedBook;
    
    

    // Load PDF document
    pdfjsLib.getDocument(pdfData).promise.then(function(pdf) {
        // Fetch the first page
        pdf.getPage(1).then(function(page) {
            const viewport = page.getViewport({ scale: 1 });
            
            // Create a canvas element
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // Render the PDF page into the canvas context
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };

            page.render(renderContext).promise.then(function() {
                // Convert the canvas to an image
                const image = document.getElementById('coverImage');
                
                // Set the dimensions for the image
                image.height = 200;
                image.width = 200;
                
                // Set the image source to the canvas data URL
                image.src = canvas.toDataURL();
            });
        });
    });
    
}


// Function to be called when a key is pressed
function keyPressed(event) {
    
    console.log(event.key);
    // Check if the 'Enter' key is pressed
    if (event.key === ' ') {
        event.preventDefault();
        toggle();
    }
    else if (event.key === 'ArrowLeft')
    {
        stepBackward();
    }
    else if (event.key === 'ArrowRight')
    {
        stepForward();
    }
}



function updateSlideDisplay() {
    // Example: Update some display or perform other operations
    let speedDisplay = document.getElementById("speedValue");
    speedDisplay.textContent = wpm; // Update displayed value

    let wordDisplay = document.getElementById("wordValue");
    

    wordDisplay.textContent = wordsAtATime; // Update displayed value
}


function updatePlaceSlider()
{
    
    let wordsPerLine = wordsAtATime;
    
    let length = (sortedBook.length - 1) * wordsPerLine;
    let place = wordIndex * wordsPerLine;
    let placeSlideVal = (place / length) * 100;
    
    var slider = document.getElementById("placeSlider");
    slider.value = placeSlideVal;

    var output = document.getElementById("placeValue");
    output.innerHTML = wordsToTime(wordIndex * wordsAtATime, wpm, wordsAtATime);// * avgCharsPerWord;
    

    var end = document.getElementById("placeDestination");
    end.innerHTML = wordsToTime(((sortedBook.length - 1) * wordsAtATime) - (wordIndex * wordsAtATime), wpm, wordsAtATime);//length - (wordIndex * wordsPerLine);
}

function toggle() 
{
    if (!isPlaying) 
    { 
        play(); 
        let button = document.getElementById("play");
        button.textContent = "||";
    }
    else 
    {
        stop();
        let button = document.getElementById("play");
        button.textContent = "\u25B6";
    }
}

function wordsToTime(numWords, wordsPerMinute, wordsAtATime) {
    // Calculate the number of stops needed
    var numStops = numWords / wordsAtATime;

    // Calculate words per second
    var wordsPerSecond = wordsPerMinute / 60;

    // Calculate the time per stop in seconds
    var timePerStop = wordsAtATime / wordsPerSecond;

    // Total time in seconds
    var totalTimeInSeconds = numStops * timePerStop;

    // Calculate hours, minutes, and seconds
    var numHours = Math.floor(totalTimeInSeconds / 3600);
    var numMinutes = Math.floor((totalTimeInSeconds % 3600) / 60);
    var numSeconds = Math.floor(totalTimeInSeconds % 60);

    // Format the time as HH:MM:SS
    var formattedTime = "";

    // Number of hours on the clock
    if (numHours > 0) {
        formattedTime += numHours + ":";
    }

    // Number of minutes on the clock
    if (numMinutes < 10) {
        formattedTime += "0" + numMinutes + ":";
    } else {
        formattedTime += numMinutes + ":";
    }

    // Number of seconds on the clock
    if (numSeconds < 10) {
        formattedTime += "0" + numSeconds;
    } else {
        formattedTime += numSeconds;
    }

    console.log(formattedTime);
    return formattedTime;
}




function setBookmark(cookieName, cookieValue, expirationDays) {
    stop();
    const d = new Date();
    d.setTime(d.getTime() + (expirationDays * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = cookieName + "=" + cookieValue + ";" + expires + ";path=/";
}

function getBookmark(cookieName) {
    stop();
    
    console.log(cookieName);

    const name = cookieName + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(';');
    for(let i = 0; i < cookieArray.length; i++) {
        let cookie = cookieArray[i];
        while (cookie.charAt(0) === ' ') {
            cookie = cookie.substring(1);
        }
        if (cookie.indexOf(name) === 0) {
            // Extract the value part (which is a number)
            var valueString = cookie.substring(name.length); // +1 to skip '='
            console.log(valueString);

            // Convert the string value to a number
            wordIndex = parseInt(valueString);
            
        }
    }

    console.log("word index: " + wordIndex);
    loadWords();
    
}

function play() {
    if (!isPlaying && wordIndex < sortedBook.length) {
        
        

        isPlaying = true;
        
        blinkInterval = setInterval(() => {
            console.log("played");
            console.log("word index is :" + wordIndex);
            
            

            if (wordIndex >= sortedBook.length - 1)
            {
                toggle();
            }
            else {
                wordIndex++;

                loadWords();
            }


            
            
        }, wordInterval);
    }
}

function stop() {
    if (isPlaying) {
        clearInterval(blinkInterval);
        isPlaying = false;

        console.log("stopped");
    }
}

function stepForward() {
    stop();

    if (wordIndex < sortedBook.length - 1) {
        
        console.log(wordIndex);
        console.log(sortedBook.length);

        wordIndex++;
        loadWords();

    }

}

function stepBackward() {
    stop();

    if (wordIndex > 0)
    {
        wordIndex--;
        loadWords();

    }
    

}

function loadWords() {
    
    // Select the <h2> element by its ID
    let last = document.getElementById('lastWords');
    let current = document.getElementById('speedWords');
    let next = document.getElementById('nextWords');

    let newWords = "";


    // Setting current words
    if (wordIndex < sortedBook.length) {
        newWords = sortedBook[wordIndex]
    }
    
    // Replace the text content of the <h2> element
    console.log(newWords);

    // If newwords is blank
    if (newWords != null && newWords != "") 
    {
        current.textContent = newWords.trim();
    }
    else { current.textContent = "..."}


    newWords = "";

    // Setting last words
    if (wordIndex - 1 < sortedBook.length && wordIndex - 1 >= 0) {
        newWords = sortedBook[wordIndex - 1];
    }
      
    // Replace the text content of the <h2> element
    console.log(newWords);

    if (newWords != null && newWords != "") 
    {
        last.textContent = newWords.trim();
    }
    else { last.textContent = "..."}


    newWords = "";

    // Setting next words

    if (wordIndex + 1 < sortedBook.length && wordIndex + 1 >= 0) {
        newWords = sortedBook[wordIndex + 1]
    }
       
    // Replace the text content of the <h2> element
    console.log(newWords);

    if (newWords != null && newWords != "") 
    {
        next.textContent = newWords.trim();
    }
    else { next.textContent = "..."}



    // Update index to make sense 
    if (wordIndex < 0)
    {
        wordIndex = 0;
    }
    else if (wordIndex >= sortedBook.length)
    {
        wordIndex = sortedBook.length - 1;
    }

    updatePlaceSlider();

    console.log(wordIndex);
        
}


function adjustFontSize() {
    const container = document.getElementById('textContainer');
    const lastText = document.getElementById('lastWords');
    const nextText = document.getElementById('nextWords');
    
    const containerWidth = container.offsetWidth;
    const textWidth = lastText.scrollWidth; // Use scrollWidth to get full width including overflow
    
    // Get current font size
    let fontSize = parseFloat(window.getComputedStyle(lastText, null).getPropertyValue('font-size'));
    
    // Calculate scale factor
    const scale = containerWidth / textWidth;
    
    // Adjust font size based on scale
    fontSize *= scale;
    
    // Limit font size to not exceed the container width
    const maxFontSize = parseFloat(window.getComputedStyle(container, null).getPropertyValue('font-size'));
    fontSize = Math.min(fontSize, maxFontSize);
    
    // Apply the new font size
    lastText.style.fontSize = fontSize + 'px';
    nextText.style.fontSize = fontSize + 'px';
}

// Function to be called when a key is pressed
function keyPressed(event) {
    
    console.log(event.key);
    // Check if the 'Enter' key is pressed
    if (event.key === ' ') {
        event.preventDefault();
        toggle();
    }
    else if (event.key === 'ArrowLeft')
    {
        stepBackward();
    }
    else if (event.key === 'ArrowRight')
    {
        stepForward();
    }
}