# CSC-519-HW2 #
By xding3

## Execution ##
0. Direct to the main folder
1. Install packages:  `npm install`  
2. Generate test file: `node main.js`
3. See coverage: 
```
[Windows] node_modules\.bin\istanbul cover test.js
[Other] node_modules/.bin/istanbul cover test.js
```
4. (Optional) See a fully annotated HTML report: 
```
[Windows] start coverage/lcov-report/HW2/subject.js.html 
[Other] open coverage/lcov-report/HW2/subject.js.html
```
## Files ##

 **main.js**: Main code driving constraint discovering and test case generation.

 **subject.js**: This is the code being tested. It contains some simple code with operations on strings, integers, files, and phone numbers.

 **test.js**: This is an automatically created test script. Running `node main.js` will create a new `test.js`.

## Screenshots ##
1. Coverage for subject.js

![](https://github.ncsu.edu/xding3/HW2/blob/master/Screenshot/subject.png)

2. Coverage for mystery.js

![](https://github.ncsu.edu/xding3/HW2/blob/master/Screenshot/mystery.png)


## Specification ##
The main.js is now generating test cases for subject.js. To work on mystery.js, you can replace all the `subject` string in main.js with `mystery`.


