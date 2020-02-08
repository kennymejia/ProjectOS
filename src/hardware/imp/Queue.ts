export class Queue 
{ 
    private queue = [];
    
    // Array is used to implement a Queue 
    constructor() 
    { 
        this.queue = []; 
    } 
                  
    enqueue(element) 
    {     
        // adding element to the queue 
        this.queue.push(element); 
    } 

    dequeue() 
    { 
        // removing element from the queue 
        // returns underflow when called  
        // on empty queue 
        if(this.isEmpty()) 
            return "Underflow"; 
        return this.queue.shift(); 
    } 

    front() 
    { 
        // returns the Front element of  
        // the queue without removing it. 
        if(this.isEmpty()) 
            return "No elements in Queue"; 
        return this.queue[0]; 
    } 

    isEmpty() 
    { 
        // return true if the queue is empty. 
        return this.queue.length == 0; 
    } 

    printQueue() 
    { 
        var str = ""; 
        for(var i = 0; i < this.queue.length; i++) 
            str += "[" + this.queue[i] + "]" +" "; 
        return str; 
    }

    size()
    {
        return this.queue.length;
    }
} 