// ======================================================
// JavaScript Practice: Classes & OOP Exercises
// ======================================================
//
// Each problem explains what your class should do.
// Write the class where it says "your code here".
// Test your classes with the examples provided.
// ======================================================


// 1. Car Class
// Create a class Car with:
// - properties: brand, model, year
// - method: getDescription() → returns "brand model (year)"
//
// Example:
// let car = new Car("Toyota", "Camry", 2020);
// car.getDescription() ➔ "Toyota Camry (2020)"
class Car {
    // your code here
}


// 2. Circle Class
// Create a class Circle with:
// - property: radius
// - getter: area → returns area of the circle (πr²)
// - getter: circumference → returns circumference (2πr)
//
// Example:
// let c = new Circle(5);
// c.area ➔ 78.54...
// c.circumference ➔ 31.41...
class Circle {
    // your code here
}


// 3. Animal Inheritance
// Create a base class Animal with:
// - property: name
// - method: speak() → "<name> makes a sound"
//
// Create a subclass Dog that overrides speak():
// - speak() → "<name> barks!"
//
// Example:
// let a = new Animal("Generic");
// a.speak() ➔ "Generic makes a sound"
// let d = new Dog("Rex");
// d.speak() ➔ "Rex barks!"

class Animal {

}

class Dog {

}


// 4. Book Class
// Create a class Book with:
// - properties: title, author, pages
// - method: getSummary() → "title by author, X pages"
//
// Example:
// let b = new Book("1984", "George Orwell", 328);
// b.getSummary() ➔ "1984 by George Orwell, 328 pages"
class Book {
    // your code here
}


// 5. BankAccount Class
// Create a class BankAccount with:
// - properties: owner, balance
// - methods: deposit(amount), withdraw(amount)
//   (deposit adds to balance, withdraw subtracts if enough funds)
// - method: getBalance() → returns current balance
//
// Example:
// let acct = new BankAccount("Alice", 100);
// acct.deposit(50);
// acct.withdraw(30);
// acct.getBalance() ➔ 120
class BankAccount {
    // your code here
}
