# JavaScript: Create Element and Append Child

This lesson demonstrates how to **create new HTML elements dynamically** with JavaScript and display them on the page.  
It also covers how to **capture user input** and use it in the backend, such as generating lists of variable length.  
A common example is using an `<ol>` or `<ul>` element and programmatically adding `<li>` items to it.

---

## Getting Input from the HTML

Before creating new elements, we first need to retrieve input and the parent container from the DOM.

```javascript
let entryInput = document.querySelector("#entry");
let parentElementList = document.querySelector("#list");
```

In JavaScript, **input values** are accessed using the `.value` property.

```javascript
console.log(entryInput.value); // Displays what the user typed
```

---

## Creating and Appending Elements

Every new element needs a **parent element** to attach to.  
In this example, the parent is the `<ul>` element, and the new child will be an `<li>`.

```javascript
let newElement = document.createElement("li");
newElement.textContent = "Test Element";
parentElementList.appendChild(newElement); // Adds the element to the <ul>
```

This code creates a new `<li>` element, gives it text content, and appends it to the unordered list.

---

## Using Event Listeners to Add Elements Dynamically

Instead of adding elements immediately, we can **wait for a user action**, such as pressing a button, before adding them.  
We'll use an **event listener** for that.

```javascript
let addButton = document.querySelector("#add");

addButton.addEventListener("click", function () {
    let newElement = document.createElement("li");
    newElement.textContent = entryInput.value;
    parentElementList.appendChild(newElement);
});
```

Here’s what happens step-by-step:

1. The script listens for a **click** event on the button with the ID `#add`.
2. When clicked, it creates a new `<li>` element.
3. The text of the new element is set to whatever the user typed into the input field.
4. The new element is appended to the existing list (`<ul>`).

---

## Key Takeaways

- Use `.value` to retrieve user input from form fields.  
- Create new elements dynamically with `document.createElement("tagName")`.  
- Use `.textContent` to define text for elements.  
- Append elements to the DOM using `.appendChild(childElement)`.  
- Combine these with event listeners to make **interactive and dynamic web pages**.
