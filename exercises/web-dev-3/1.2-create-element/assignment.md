### Description
To continue learning web application development, you'll recreate a console program  that allows a user to manage a library of items. The app will include basic features and functionality: display items in a list, add and remove items, randomly choose an item from the list, and validate user input. For this assignment, you'll practice DOM operations, event listeners, functions, conditionals, loops, and arrays.

### Requirements
Design and implement a user interface that includes the following input and output elements:
- a list of all items currently in the library, one per line, that updates after each user action.
- a text input that allows the user to enter an item to be added or removed, based on the action.
- a button that adds the entered item to the list. Validation: the entry must not be empty.
- a button that removes the entered item from the list. Validation: the entry must exist.
- a button that randomly chooses one item from the list and displays it. Validation: the list must not be empty.
- a display element that shows the picked item, or a message if any of the validation rules above are triggered.
- Use querySelector to query elements and the textContent property to modify elements.
- Use createElement and appendChild to create and display the list of items in the library.
- Use addEventListener to establish a user action corresponding to each of the three buttons.
- Create a separate function for each of the three user actions, and one function to display the list of items.
- Create an array of strings to store the library's data, and use array operations to implement each function.

### Selectors
Use the following selectors when defining UI elements that will be used by automated tests:

- #entry: the text input element
- #add: the button element to add an item
- #remove: the button element to remove an item
- #pick: the button element to pick a random item
- #list: the list element that contains one child element per item
- #notice: the display element that shows the picked item and validation messages

### Optional Challenges
- Add one or more additional user actions applicable to the library you design.
- Allow the user to enter more than one data attribute for each item in the library.

- Design and implement a more visually defined user interface for the application.
