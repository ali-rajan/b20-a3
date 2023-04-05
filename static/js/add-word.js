
function testResults (form) {
    var inputValue = form.inputbox.value;
    var valid = true;
    if (inputValue.length != 5) {
        valid = false;
    } else {
        for (var i = 0; i < inputValue.length; i++) {
            if ((/[a-zA-Z]/).test(inputValue.charAt(i)) == false) {
                valid = false
            }
        }
    }
    output(valid);
}

function output(valid) {
    const word_result = document.getElementById("form-result");
    if (valid) {
        word_result.innerHTML = "Word has been....added";
    } else {
        word_result.innerHTML = "Word has not been....added";
    }
}

// function downloadFile() {
//     const textFile = btoa(emailsList.join('\n'))
//     const saveElement = document.createElement('a')
//     saveElement.href = `data:text/plain;base64,${textFile}`
//     saveElement.download = 'myList.txt'
//     document.body.appendChild(saveElement)
//     saveElement.click()
//     document.body.removeChild(saveElement)
//   }
