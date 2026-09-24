# JavaScript: Event Listeners

Event listeners let your HTML, CSS, and JavaScript **work together**.  
An **event listener** waits for an event to occur (like a click), then **runs code** in response.

---

## Example

```html
<button id="test_Button">Click me</button>
<p id="test_Output"></p>
<span id="emote"></span>
```

You have learned how to write HTML, CSS, and JavaScript code,
Now we need to learn how to make them work together. The most basic way
is using Event Listeners. An event listener is a procedure in JavaScript 
that waits for an event to occur, then does something when that event occurs.

```javascript
let testButton = document.querySelector("#test_Button");
let testOutput = document.getElementById("test_Output");
let emoji = document.querySelector("#emote");

testButton.addEventListener("click", function () {
    testOutput.textContent = "The button WAS clicked!";
    
    // In JavaScript you put \u{} with the emoji code inside
    emoji.textContent = "\u{1F60F}"
});
```

This code adds an event listener to the button with the ID "#test_Button".
When the button is clicked, the text content of the element with the class 
"#test_Output" changes to "The button was clicked!". Remember to include the
"#" before ID and "." before class names when using querySelector().

getElementById() is a method that returns the element with the specified ID.
querySelector() is a method that returns the first element that matches any 
specified CSS selector (class, id, tag, etc).

You need the empty function() {} to define what happens when the event occurs.

---

## Key Takeaways

- `element.addEventListener("event", handler)` attaches a handler to run when the event fires.  
- `getElementById("id")` selects an element **by ID**.  
- `querySelector("selector")` selects the **first match** of any CSS selector (`#id`, `.class`, `tag`, etc.).  
- Update text with `element.textContent = "..."`.  
- Unicode code points can be inserted with `\u{...}` strings.



