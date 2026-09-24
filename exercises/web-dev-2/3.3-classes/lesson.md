# JavaScript Classes

**Classes** in JavaScript are templates for creating objects.  
They bundle together **data** (properties) and **behavior** (methods).  
Think of a class as a **blueprint**, and objects created from it as **instances**.

---

## Creating a Simple Class

```javascript
class Person {
    constructor(name, age) {
        this.name = name;   // property
        this.age = age;     // property
    }

    // method
    greet() {
        console.log(`Hi, my name is ${this.name} and I am ${this.age} years old.`);
    }
}
```

### Creating Instances (Objects from the Class)

```javascript
let alice = new Person('Alice', 25);
let bob = new Person('Bob', 30);

alice.greet();  // Hi, my name is Alice and I am 25 years old.
bob.greet();    // Hi, my name is Bob and I am 30 years old.
```

**Explanation:**
- `class` defines the blueprint.
- `constructor()` initializes object properties.
- `this` refers to the instance.
- `new` creates a new instance of the class.

---

## Adding Methods to a Class

```javascript
class Dog {
    constructor(name) {
        this.name = name;
    }

    bark() {
        console.log(`${this.name} says: Woof!`);
    }
}

let rex = new Dog('Rex');
rex.bark();  // Rex says: Woof!
```

### Updating Properties

```javascript
rex.name = 'Max';
rex.bark();  // Max says: Woof!
```

---

## Getters and Setters

Getters and setters allow you to define **custom behavior** when reading or writing object properties.

```javascript
class Rectangle {
    constructor(width, height) {
        this.width = width;
        this.height = height;
    }

    // getter
    get area() {
        return this.width * this.height;
    }

    // setter
    set changeWidth(newWidth) {
        this.width = newWidth;
    }
}

let rect = new Rectangle(4, 5);
console.log(rect.area);  // 20
rect.changeWidth = 10;
console.log(rect.area);  // 50
```

**Explanation:**
- `get` defines a property that runs like a method.
- `set` defines behavior when a property is assigned.

---

## Inheritance

A class can **extend** another class to inherit its properties and methods.

```javascript
class Animal {
    constructor(name) {
        this.name = name;
    }

    speak() {
        console.log(`${this.name} makes a sound.`);
    }
}

class Cat extends Animal {
    constructor(name, color) {
        super(name);     // call parent constructor
        this.color = color;
    }

    speak() {
        console.log(`${this.name} the ${this.color} cat meows!`);
    }
}

let kitty = new Cat('Whiskers', 'black');
kitty.speak();  // Whiskers the black cat meows!
```

**Key Notes:**
- `extends` creates a subclass.
- `super()` calls the parent class constructor.
- Subclasses can override parent methods.

---

## Static Methods

Static methods belong to the **class itself**, not to individual instances.

```javascript
class MathHelper {
    static add(x, y) {
        return x + y;
    }
}

console.log(MathHelper.add(5, 10));  // 15
```

You can call static methods **without** creating an instance.

---

## Summary

| Concept | Description | Example |
|----------|--------------|----------|
| `class` | Defines a class | `class Person {}` |
| `constructor()` | Initializes object properties | `constructor(name){ this.name = name; }` |
| `this` | Refers to the instance | `this.name = 'Alice'` |
| `new` | Creates an instance | `let p = new Person()` |
| `extends` | Inherits from another class | `class Dog extends Animal` |
| `super()` | Calls parent constructor | `super(name)` |
| `get` / `set` | Define property accessors | `get area() {}` |
| `static` | Defines a method on the class itself | `static method() {}` |

---

### Key Takeaways
- Classes are templates for creating objects.
- `constructor()` defines how an object is initialized.
- Methods define what objects can do.
- Use `extends` and `super()` for inheritance.
- Getters and setters let you control property access.
- `static` methods are utility functions that don’t depend on instance data.