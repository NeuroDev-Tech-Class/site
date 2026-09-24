### Description 
 To explore basic user input and output, as well as practice all the things we  learned about in Unit 2, you'll create an interactive, console-based JavaScript program  that challenges a user with a set of random numerical problems and presents a final  scorecard afterward. The quiz should start by asking the user to choose between at  least two problem categories to practice. You'll need to randomly generate number  values for the problems, present the problems to the user in sequence, evaluate the  user's responses, and provide feedback by tracking the user's score. Refer to the  example output below for an idea of how the program might be presented to the user,  but vary your messaging and problems from those demonstrated. 

 ### Requirements 
 ■   When the program starts, prompt the user to choose between at least two  distinct problem types. For each:  
 ■   Use a  for  loop to present a fixed-size sequence of problems, e.g., 10 or 20  problems.  
 ■   Use  random  number logic to generate integer values.  Keep difficulty in mind  when deciding the random ranges.  
 ■   Use string formatting to output problems to the user, combining words,  operators, and values as needed.  
 ■   Use conditionals and expressions to grade responses and provide feedback  on each correct or incorrect answer.  
 ■   Use the  console.log  function for console output and  the provided  prompt 
 function to collect user input.  
 ■   Use variables to track the user's score and display a score card with the  results at the conclusion of the quiz.  
 ■   Use at least five functions to organize your code. Possible function outline:  functions to present a problem of each type, functions to grade a problem of  each type, functions to run the quiz for each category and tally a score, and  one  main  function to ask the user to choose a category  and invoke the  appropriate function. 

 ### Prompt Function 
 We haven’t used the prompt function before; however, it is simple to use. There is an example at the beginning of quiz.js. Run `npm install` once to install it, then `npm start` to run your quiz. Simply declare a variable and have a set  equal to a prompt statement. The variable with then equal whatever the user types into  the terminal. 