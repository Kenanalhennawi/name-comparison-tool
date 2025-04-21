// --- Helper Functions ---

// Given names: remove punctuation but keep spaces (for later splitting)
function sanitizeGivenName(name) {
    if (!name) return "";
    return name.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ ]/g, "").replace(/\s+/g, " ").trim();
}

// Surnames: remove punctuation but keep spaces (like Given Name)
function sanitizeSurname(name) {
    if (!name) return "";
    return name.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ ]/g, "").replace(/\s+/g, " ").trim();
}

// --- Extraction Functions ---

// Extract the given name by scanning for a line containing "given" & "nam" or "prénom".
// Handles colon separation, same-line extraction, or next-line fallback.
function extractGivenName(lines) {
    console.log("Attempting to extract Given Name..."); // Added log
    const keywordsGiven = ["given name", "given names"];
    const keywordsPrenom = ["prénom", "prénoms"];
    const potentialKeywords = [...keywordsGiven, ...keywordsPrenom, "first name", "first names"];
    const candidateLabelKeywords = ["prénom", "given", "first"];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lowerLine = line.toLowerCase();
        let keywordFound = false;
        let keywordEndIndex = -1;

        if (potentialKeywords.some(k => lowerLine.includes(k))) {
           keywordFound = true;
        }

        if (keywordFound) {
             if (lowerLine.includes("father") || lowerLine.includes("mother") || lowerLine.includes("père") || lowerLine.includes("mère")) {
                 console.log("Skipping line for given name extraction (contains father/mother):", line); // Added log
                 continue;
             }

            console.log("Potential given name line found:", line); // Added log

            let candidate = "";
            let processedOnSameLine = false;

            const colonIndex = line.indexOf(":");
            if (colonIndex !== -1) {
                candidate = line.substring(colonIndex + 1).trim();
                processedOnSameLine = true;
                console.log("Given name candidate (from colon):", candidate); // Added log
            } else {
                let searchIndex = -1;
                const foundKeyword = potentialKeywords.find(k => lowerLine.includes(k));

                if(foundKeyword) {
                    searchIndex = lowerLine.lastIndexOf(foundKeyword);
                    keywordEndIndex = searchIndex + foundKeyword.length;
                }

                if (keywordEndIndex !== -1 && keywordEndIndex < line.length) {
                     candidate = line.substring(keywordEndIndex).trim();
                     candidate = candidate.replace(/^[^A-Za-zÀ-ÖØ-öø-ÿ]*/, '');
                     if (candidate.length > 0) {
                          processedOnSameLine = true;
                          console.log("Given name candidate (from same line, no colon):", candidate); // Added log
                     }
                }
            }

            if (!processedOnSameLine || candidate.length < 2) {
                 console.log("Attempting next line fallback for given name..."); // Added log
                 if (i < lines.length - 1) {
                      const nextLineCandidate = lines[i + 1].trim();
                       if (nextLineCandidate.length > 1 && nextLineCandidate.match(/[A-Za-zÀ-ÖØ-öø-ÿ]{2,}/) && !nextLineCandidate.toLowerCase().includes("father") && !nextLineCandidate.toLowerCase().includes("mother") && !nextLineCandidate.toLowerCase().includes("père") && !nextLineCandidate.toLowerCase().includes("mère")) {
                           if (!processedOnSameLine || candidate.length < 2) {
                              candidate = nextLineCandidate;
                              console.log("Given name candidate (using next line):", candidate); // Added log
                           } else {
                              console.log("Keeping potentially short candidate from same line:", candidate); // Added log
                           }
                       } else {
                          console.log("Skipping next line as potential noise or other name field:", nextLineCandidate); // Added log
                           if (!processedOnSameLine) candidate = "";
                       }
                 } else if (!processedOnSameLine) {
                      candidate = "";
                      console.log("No next line available for given name fallback."); // Added log
                 }
            }

            let sanitizedCandidate = sanitizeGivenName(candidate);
            let tokens = sanitizedCandidate.split(" ").filter(t => t.length > 0);

            let firstWordToken = "";
            if (tokens.length > 0) {
                 if (candidateLabelKeywords.includes(tokens[0].toLowerCase())) {
                     if (tokens.length > 1) {
                         firstWordToken = tokens[1];
                     } else {
                         firstWordToken = "";
                     }
                 } else {
                     firstWordToken = tokens[0];
                 }
            }

            console.log("Final Candidate for first name:", candidate, "-> Sanitized Token:", firstWordToken); // Added log
            if (firstWordToken && firstWordToken.length > 1) {
                console.log("Given Name extracted:", firstWordToken.toUpperCase()); // Added log
                return firstWordToken.toUpperCase();
            }
        }
    }
    console.log("Given Name extraction failed."); // Added log
    return "";
}

function extractSurname(lines) {
    console.log("Attempting to extract Surname..."); // Added log
    const surnameKeywords = ["surname", "surmame", "sumame", "nom", "last name", "last names"];
    const definitiveExcludeKeywords = ["given", "prénom", "nom du p", "nom de la m", "father", "mother", "père", "mère", "first name", "first names"];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lowerLine = line.toLowerCase();
        const hasSurnameKeyword = surnameKeywords.some(keyword => lowerLine.includes(keyword));

        if (hasSurnameKeyword) {
            const shouldExclude = definitiveExcludeKeywords.some(exclude => lowerLine.includes(exclude));

            if (shouldExclude) {
                console.log("Skipping line identified as another name field:", line); // Added log
                continue;
            }

            console.log("Potential surname line found:", line); // Added log

            let candidate = "";
            const colonIndex = line.indexOf(":");

            if (colonIndex !== -1) {
                candidate = line.substring(colonIndex + 1).trim();
                 console.log("Surname candidate (from colon):", candidate); // Added log
            } else {
                 let searchIndex = -1;
                 const foundKeyword = surnameKeywords.find(k => lowerLine.includes(k));
                 if (foundKeyword) {
                     searchIndex = lowerLine.lastIndexOf(foundKeyword);
                     const keywordEndIndex = searchIndex + foundKeyword.length;
                     if (keywordEndIndex < line.length) {
                          candidate = line.substring(keywordEndIndex).trim().replace(/^[^A-Za-zÀ-ÖØ-öø-ÿ]*/, '');
                          if (candidate.length > 0) {
                            console.log("Surname candidate (from same line, no colon):", candidate); // Added log
                          }
                     }
                 }
                 if (candidate.length < 2 && i < lines.length - 1) {
                      const nextLineCandidate = lines[i + 1].trim();
                      if (nextLineCandidate.length > 1 && nextLineCandidate.match(/[A-Za-zÀ-ÖØ-öø-ÿ]{2,}/) && !nextLineCandidate.toLowerCase().includes("father") && !nextLineCandidate.toLowerCase().includes("mother") && !nextLineCandidate.toLowerCase().includes("père") && !nextLineCandidate.toLowerCase().includes("mère") && !nextLineCandidate.toLowerCase().includes("given") && !nextLineCandidate.toLowerCase().includes("prénom")) {
                           candidate = nextLineCandidate;
                           console.log("Surname candidate (using next line as fallback):", candidate); // Added log
                      }
                 }
            }

            if (candidate.indexOf("/") !== -1) {
                let tokens = candidate.split("/");
                candidate = tokens[tokens.length - 1].trim();
                 console.log("Surname candidate (after slash):", candidate); // Added log
            }

            let sanitizedCandidate = sanitizeSurname(candidate);
            let firstWordToken = sanitizedCandidate.split(" ")[0];

            console.log("Final Candidate for last name:", candidate, "-> Sanitized Token:", firstWordToken); // Added log
            if (firstWordToken && firstWordToken.length > 1) {
                 console.log("Surname extracted:", firstWordToken.toUpperCase()); // Added log
                return firstWordToken.toUpperCase();
            }
             console.log("Sanitized surname candidate was empty or too short:", firstWordToken); // Added log
        }
    }
    console.log("Surname extraction failed."); // Added log
    return "";
}

function parseMRZ(lines) {
    console.log("Attempting MRZ fallback parsing...");
    let mrzLine1 = null;
    let mrzLine2 = null;
    const mrzCandidates = lines.filter(line => line.includes('<') && line.length > 30);

    if (mrzCandidates.length >= 2) {
        mrzLine1 = mrzCandidates[mrzCandidates.length - 2];
        mrzLine2 = mrzCandidates[mrzCandidates.length - 1];
        console.log("Potential MRZ lines found:", mrzLine1, mrzLine2); // Added log

        try {
            const parts = mrzLine1.split('<<');
            if (parts.length >= 2) {
                let surnamePart = parts[0].substring(5);
                let surname = surnamePart.replace(/</g, ' ').trim();
                let givenNamesPart = parts[1];
                let givenNames = givenNamesPart.replace(/</g, ' ').trim();
                const sanitizedSurname = sanitizeSurname(surname);
                const sanitizedGivenNames = sanitizeGivenName(givenNames);

                console.log("MRZ parsed - Surname:", surname, "Given Names:", givenNames); // Added log
                console.log("MRZ parsed - Sanitized Surname:", sanitizedSurname, "Sanitized Given Names:", sanitizedGivenNames); // Added log


                if (sanitizedSurname || sanitizedGivenNames) {
                     console.log("MRZ fallback successful."); // Added log
                    return {
                        surname: sanitizedSurname,
                        givenNames: sanitizedGivenNames
                    };
                }
            }
        } catch (e) {
            console.error("Error parsing MRZ lines:", e); // Added log
            return null;
        }
    }
    console.log("Could not identify potential MRZ lines or parse them successfully."); // Added log
    return null;
}

function preprocessImage(file) {
    console.log("Starting image preprocessing..."); // Added log
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        const img = new Image();

        reader.onload = function (e) {
            img.src = e.target.result;
        };

        img.onload = function () {
            const canvas = document.createElement("canvas");
            const MAX_WIDTH = 1500;
            let scale = 1;
            if (img.width > MAX_WIDTH) {
                scale = MAX_WIDTH / img.width;
            }
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;

            const ctx = canvas.getContext("2d", { alpha: false });
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                data[i] = avg;
                data[i + 1] = avg;
                data[i + 2] = avg;
            }
            ctx.putImageData(imageData, 0, 0);
            console.log("Image preprocessed (grayscale, size adjusted if needed)"); // Added log
            resolve(canvas.toDataURL("image/png"));
        };

        img.onerror = function (err) {
             console.error("Error loading image:", err); // Added log
             reject(new Error("Failed to load image: " + err));
         };
        reader.onerror = function (err) {
             console.error("Error reading file:", err); // Added log
             reject(new Error("Failed to read file: " + err));
        };
        reader.onabort = function() {
            console.warn("File reading was aborted."); // Added log
            reject(new Error("File reading was aborted."));
        };


        if (file) {
            reader.readAsDataURL(file);
        } else {
             console.error("No file provided to preprocess."); // Added log
            reject(new Error("No file provided to preprocess."));
        }
    });
}

async function processImage() {
    console.log("Starting processImage..."); // Added log
    const loadingIndicator = document.getElementById("loadingIndicator");
    // FIX: Removed the space in the ID selector
    const fileInput = document.getElementById("passportImage");
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select a passport image file first.");
         console.log("No file selected."); // Added log
        return;
    }

    if (!file.type.startsWith('image/')) {
        alert("Please upload a valid image file (e.g., PNG, JPG, GIF).");
         console.log("Invalid file type selected:", file.type); // Added log
        return;
    }

    loadingIndicator.classList.remove("hidden");
    const uploadButton = document.querySelector('button[onclick="processImage()"]');
    if (uploadButton) uploadButton.disabled = true;

    try {
        console.log("Starting image preprocessing..."); // Added log
        const preprocessedDataUrl = await preprocessImage(file);

        console.log("Starting OCR recognition..."); // Added log
        const { data: { text } } = await Tesseract.recognize(
            preprocessedDataUrl,
            'eng',
            {
                logger: m => console.log(`OCR Status: ${m.status}, Progress: ${(m.progress * 100).toFixed(1)}%`)
            }
        );

        console.log("OCR finished. Extracted text length:", text.length); // Added log
        console.log("Raw Extracted text:\n", text); // Added log for raw text
        extractNames(text);

    } catch (err) {
        console.error("Error during image processing or OCR:", err); // Added log
        alert(`An error occurred: ${err.message || 'Unknown error during processing.'} Check console for details.`);
    } finally {
        console.log("Finishing processImage."); // Added log
        loadingIndicator.classList.add("hidden");
        if (uploadButton) uploadButton.disabled = false;
        // FIX: Removed the space in the ID selector
        const fileInputToClear = document.getElementById("passportImage");
        if (fileInputToClear) fileInputToClear.value = ''; // Clear file input after processing attempt
    }
}

function extractNames(text) {
    console.log("Starting extractNames..."); // Added log
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    console.log("Processing lines:", lines); // Added log

    let firstNamePrimary = extractGivenName(lines);
    let lastNamePrimary = extractSurname(lines);

    let finalFirstNameCandidate = firstNamePrimary;
    let finalLastNameCandidate = lastNamePrimary;

    console.log("Primary Extraction Results - First Name:", firstNamePrimary, "Last Name:", lastNamePrimary); // Added log

    if (!finalFirstNameCandidate || !finalLastNameCandidate) {
        console.log("Primary extraction incomplete, attempting MRZ fallback..."); // Added log
        const mrzNames = parseMRZ(lines);
        if (mrzNames) {
            finalFirstNameCandidate = finalFirstNameCandidate || mrzNames.givenNames;
            finalLastNameCandidate = finalLastNameCandidate || mrzNames.surname;
            console.log("MRZ Fallback applied. Candidates - First Name:", finalFirstNameCandidate, "Last Name:", finalLastNameCandidate); // Added log
        } else {
             console.log("MRZ Fallback attempted but failed or found no names."); // Added log
        }
    } else {
         console.log("Primary extraction successful, skipping MRZ fallback."); // Added log
    }


    let extractedFirstNameToken = '';
    if (finalFirstNameCandidate) {
        extractedFirstNameToken = finalFirstNameCandidate.split(" ")[0] || '';
    }

    let extractedLastNameToken = '';
    if (finalLastNameCandidate) {
        extractedLastNameToken = finalLastNameCandidate.split(" ")[0] || '';
    }

    console.log("Final Extracted Tokens - First Name:", extractedFirstNameToken.toUpperCase(), "Last Name:", extractedLastNameToken.toUpperCase()); // Added log

    const firstInput = document.getElementById("first1");
    const lastInput = document.getElementById("last1");

    firstInput.value = extractedFirstNameToken.toUpperCase();
    lastInput.value = extractedLastNameToken.toUpperCase();

    let message = "";
    if (extractedFirstNameToken && extractedLastNameToken) {
        message = "First and Last names extracted and filled into the form.";
    } else if (extractedFirstNameToken) {
        message = "Only First Name could be extracted. Please check/enter Last Name.";
    } else if (extractedLastNameToken) {
        message = "Only Last Name could be extracted. Please check/enter First Name.";
    } else {
        message = "Could not automatically extract names from the image. Please enter manually or try a clearer image.";
         console.log("Extraction failed."); // Added log
    }

    alert(message);
    console.log("Finished extractNames."); // Added log
}


// --- Comparison Logic (using simpler getSmartDiff) ---

function levenshtein(a, b) {
    a = a.toLowerCase();
    b = b.toLowerCase();
    const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : Math.min(dp[i - 1][j - 1], dp[i][j - 1], dp[i - 1][j]) + 1;
        }
    }
    return dp[a.length][b.length];
}

// Corrected compareNames function based on your last provided version
function compareNames() {
    console.log("Starting compareNames..."); // Added log
    const first1 = document.getElementById('first1').value.trim();
    const last1 = document.getElementById('last1').value.trim();
    const first2 = document.getElementById('first2').value.trim();
    const last2 = document.getElementById('last2').value.trim();

    console.log(`Inputs - First1: "${first1}", Last1: "${last1}", First2: "${first2}", Last2: "${last2}"`); // Added log

    if (!first1 || !first2) {
        alert('Please enter at least both first names.');
        console.log("Validation failed: Missing first names."); // Added log
        return;
    }

    // Keep the inconsistent last name check if desired
    if ((last1 && !last2) || (!last1 && last2)) {
        alert('Please fill both Last Name 1 and Last Name 2, or leave them both empty.');
        console.log("Validation failed: Inconsistent last names."); // Added log
        return;
    }


    let swapped = false;
    let distanceDirect = 0;
    let distanceSwapped = Infinity;

    // Calculate direct distance based on first names
    distanceDirect = levenshtein(first1, first2);
    console.log(`Levenshtein(First1, First2) = ${levenshtein(first1, first2)}`); // Added log


    if (last1 && last2) { // Only add last name distance if BOTH last names are present
        const lastNameDistance = levenshtein(last1, last2);
        distanceDirect += lastNameDistance;
        console.log(`Both last names present. Levenshtein(Last1, Last2) = ${lastNameDistance}. Total direct distance = ${distanceDirect}`); // Added log
    } else {
        console.log("One or both last names missing. Only first names used for direct distance calculation."); // Added log
    }


    if (last1 && first2 && first1 && last2) { // Only calculate swapped distance if ALL FOUR are present
        const swapDist1 = levenshtein(first1, last2);
        const swapDist2 = levenshtein(last1, first2);
        distanceSwapped = swapDist1 + swapDist2;
        console.log(`All four names present. Levenshtein(First1, Last2) = ${swapDist1}, Levenshtein(Last1, First2) = ${swapDist2}. Total swapped distance = ${distanceSwapped}`); // Added log
    } else {
        console.log("Not all four names present. Swapped comparison skipped."); // Added log
        distanceSwapped = Infinity; // Ensure swapped is not chosen if not all names are present
    }

    // Decide if names are likely swapped
    if (distanceSwapped < distanceDirect) {
        swapped = true;
        console.log(`Swapped distance (${distanceSwapped}) is less than direct distance (${distanceDirect}). Swapped = true.`); // Added log
    } else {
        console.log(`Swapped distance (${distanceSwapped}) is not less than direct distance (${distanceDirect}). Swapped = false.`); // Added log
    }

    // Construct the strings to compare for visual diff
    // String 1 will be Name 1 (First1 + Last1)
    // String 2 will be Name 2 (First2 + Last2) OR Swapped Name 2 (Last2 + First2)
    let strToCompare1 = first1 + (last1 ? ' ' + last1 : '');
    let strToCompare2 = '';

    if (swapped) {
        // Compare Name 1 (First1 Last1) against Name 2 swapped (Last2 First2)
        strToCompare2 = last2 + (first2 ? ' ' + first2 : ''); // Correct construction for swapped
        console.log(`Swapped comparison strings: Name1 ("${strToCompare1}") vs Swapped Name2 ("${strToCompare2}")`); // Added log
    } else {
        // Compare Name 1 (First1 Last1) against Name 2 direct (First2 Last2)
        strToCompare2 = first2 + (last2 ? ' ' + last2 : ''); // Correct construction for direct
        console.log(`Direct comparison strings: Name1 ("${strToCompare1}") vs Name2 ("${strToCompare2}")`); // Added log
    }

    // Call getSmartDiff. Your previous code called getSmartDiff(strToCompare2, strToCompare1)
    // and put the result.line1 (from strToCompare2) into #line1 and result.line2 (from strToCompare1) into #line2.
    // I will keep this order to match your previous observed behavior (Name 2/Swapped on top, Name 1 on bottom).
    const result = getSmartDiff(strToCompare2, strToCompare1);


    document.getElementById('line1').innerHTML = result.line1; // This will show Name 2 (or swapped Name 2)
    document.getElementById('line2').innerHTML = result.line2; // This will show Name 1
    document.getElementById('diffCount').textContent = `Different characters: ${result.diffCount}`;
    document.getElementById('swapInfo').textContent = swapped ? 'Note: First and last names might be swapped' : '';

    console.log("Finished compareNames."); // Added log
}

// --- Simpler getSmartDiff function with corrected pointer advancement and safety break ---
// This version uses a simpler 1-character lookahead heuristic.
function getSmartDiff(str1, str2) { // str1 is the second name string (line1), str2 is the first name string (line2)
    console.log(`[getSmartDiff] Comparing "${str1}" vs "${str2}" (str1 on line1, str2 on line2)`);

    str1 = (str1 || "").toLowerCase(); // Ensure lowercase and handle empty strings
    str2 = (str2 || "").toLowerCase();
    let i = 0, j = 0; // i for str1, j for str2
    let output1 = '', output2 = '', diffCount = 0; // output1 for str1, output2 for str2

    // Helper to format character for HTML output (space -> &nbsp;)
    const formatChar = (char) => char === ' ' ? '&nbsp;' : char;

    let iteration = 0; // Add iteration counter for safety break

    while (i < str1.length || j < str2.length) {
        iteration++;
        // Add safety break BEFORE processing the iteration
        if (iteration > str1.length + str2.length + 100) { // Adjusted safety limit
             console.error(`[getSmartDiff] Safety break triggered after ${iteration} iterations.`);
             console.log(`[getSmartDiff] Inputs: "${str1}" vs "${str2}". Pointers: i=${i}, j=${j}.`);
             // Append remaining parts as diffs before breaking
             while(i < str1.length) {
                 output1 += `<span class="diff-letter">${formatChar(str1[i])}</span>`;
                 output2 += `<span class="diff-letter">_</span>`;
                 diffCount++;
                 i++;
             }
             while(j < str2.length) {
                  output1 += `<span class="diff-letter">_</span>`;
                  output2 += `<span class="diff-letter">${formatChar(str2[j])}</span>`;
                  diffCount++;
                  j++;
             }
             break; // Exit the main loop
         }
         console.log(`[getSmartDiff] --- Iteration ${iteration} ---`);
         console.log(`[getSmartDiff] Pointers: i=${i}/${str1.length}, j=${j}/${str2.length}`);

        const ch1 = str1[i];
        const ch2 = str2[j];

        console.log(`[getSmartDiff] Chars: char1="${ch1}", char2="${ch2}"`);

        if (ch1 === ch2) {
            console.log("[getSmartDiff] Match");
            output1 += formatChar(ch1);
            output2 += formatChar(ch2);
            i++;
            j++;
        } else {
            console.log("[getSmartDiff] Mismatch");

            const next1 = str1[i + 1]; // Look ahead in str1
            const next2 = str2[j + 1]; // Look ahead in str2

            let action;

            // Corrected logic for determining action and advancing pointers
            if (ch1 === undefined && ch2 !== undefined) {
                 // str1 is exhausted, characters remaining in str2
                 action = 'advance_str2'; // Need to consume char from str2
                 console.log(`[getSmartDiff] str1 exhausted. Forcing advance_str2.`);
             } else if (ch2 === undefined && ch1 !== undefined) {
                 // str2 is exhausted, characters remaining in str1
                 action = 'advance_str1'; // Need to consume char from str1
                 console.log(`[getSmartDiff] str2 exhausted. Forcing advance_str1.`);
             } else if (next2 !== undefined && ch1 === next2) {
                 // Current char from str1 matches next char from str2
                 action = 'advance_str1'; // Consume ch1, align with next in str2
                 console.log(`[getSmartDiff] Heuristic: advance_str1 ("${ch1}" vs "_") aligns with next "${next2}" in str2.`);
             } else if (next1 !== undefined && ch2 === next1) {
                 // Current char from str2 matches next char from str1
                 action = 'advance_str2'; // Consume ch2, align with next in str1
                 console.log(`[getSmartDiff] Heuristic: advance_str2 ("_" vs "${ch2}") aligns with next "${next1}" in str1.`);
             }
            else {
                // No simple lookahead match, or both exhausted -> substitution
                 action = 'advance_both';
                 console.log(`[getSmartDiff] Defaulting to advance_both (substitution).`);
            }

            // Execute the chosen action and update outputs/pointers
            if (action === 'advance_str1') {
                // Visualize as deletion in str2 (char from str1 vs underscore)
                const displayChar1 = ch1 !== undefined ? formatChar(ch1) : '_';
                output1 += `<span class="diff-letter">${displayChar1}</span>`; // Output char from str1
                output2 += `<span class="diff-letter">_</span>`; // Output underscore for str2
                if (ch1 !== undefined) i++; // Consume char from str1
                // j stays
                diffCount++;
                console.log(`[getSmartDiff] Action: advance_str1. Pointers: i=${i}, j=${j}, diffCount=${diffCount}`);
            } else if (action === 'advance_str2') {
                 // Visualize as deletion in str1 (underscore vs char from str2)
                 const displayChar2 = ch2 !== undefined ? formatChar(ch2) : '_';
                 output1 += `<span class="diff-letter">_</span>`; // Output underscore for str1
                 output2 += `<span class="diff-letter">${displayChar2}</span>`; // Output char from str2
                 if (ch2 !== undefined) j++; // Consume char from str2
                 // i stays
                 diffCount++;
                 console.log(`[getSmartDiff] Action: advance_str2. Pointers: i=${i}, j=${j}, diffCount=${diffCount}`);
            } else if (action === 'advance_both') {
                // Visualize as substitution (char from str1 vs char from str2)
                const displayChar1 = ch1 !== undefined ? formatChar(ch1) : '_';
                const displayChar2 = ch2 !== undefined ? formatChar(ch2) : '_';
            output1 += `<span class="diff-letter">${displayChar1}</span>`;
            output2 += `<span class="diff-letter">${displayChar2}</span>`;
                if (ch1 !== undefined) i++; // Consume from str1
                if (ch2 !== undefined) j++; // Consume from str2
                // Safety break if somehow both were undefined and we got here (should be caught by loop condition and initial check)
                if (ch1 === undefined && ch2 === undefined) {
                     console.warn("[getSmartDiff] advance_both action hit with both chars undefined.");
                     break;
                }
            diffCount++;
                console.log(`[getSmartDiff] Action: advance_both. Pointers: i=${i}, j=${j}, diffCount=${diffCount}`);
            } else {
                 console.error("[getSmartDiff] Unknown action determined. Preventing infinite loop.");
                  // Fallback to prevent infinite loop in case of logic error
                  if (i < str1.length) i++; else if (j < str2.length) j++; else break;
            }
        }
    }
    // Removed the final while loops as the main loop and exhausted checks should handle termination.

    console.log(`[getSmartDiff] Diff finished. Final diffCount: ${diffCount}`);
    console.log("[getSmartDiff] Output1 (Name 2/Swapped):", output1); // Corresponds to str1 passed in
    console.log("[getSmartDiff] Output2 (Name 1):", output2); // Corresponds to str2 passed in


    return { line1: output1, line2: output2, diffCount }; // output1 goes to line1, output2 to line2
}


// --- Clear Fields Function ---
function clearFields() {
    console.log("Clearing fields..."); // Added log
    document.getElementById('first1').value = '';
    document.getElementById('last1').value = '';
    document.getElementById('first2').value = '';
    document.getElementById('last2').value = '';
    // FIX: Removed the space in the ID selector and added file input clear
    const fileInput = document.getElementById("passportImage");
    if (fileInput) fileInput.value = ''; // Clear file input added

    document.getElementById('line1').innerHTML = '';
    document.getElementById('line2').innerHTML = '';
    document.getElementById('diffCount').textContent = '';
    document.getElementById('swapInfo').textContent = '';
    // Hide loading indicator and re-enable process button
    const loadingIndicator = document.getElementById("loadingIndicator");
    if (loadingIndicator) loadingIndicator.classList.add("hidden");
    const processButton = document.querySelector('button[onclick="processImage()"]');
    if (processButton) processButton.disabled = false;

    console.log("Fields cleared."); // Added log
}