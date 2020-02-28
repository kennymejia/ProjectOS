/**
 * Super class for all hardware to manage common aspects such as logging requirements
 */

export class Hardware {

    constructor(id: number, name: String) {
        this.id = id;
        this.name = name;
    }

    public id: number = 0;
    public name: String = "";
    private debug: boolean = false;
    private cpuDebug: boolean = false;
    private mmuDebug: boolean = false;
    private vkbDebug: boolean = false;
    private date: Date = new Date();
    
    // used for general debugging, may go back and create seperate logs for everything
    protected log(message: String): void {
        
        if (this.debug) 
            console.log("[", "HW -", this.name, "ID:", this.id, "-", this.date.getTime(), "]:", message);
    }

    // used for CPU debugging
    protected cpuLog(message: String): void {
        
        if (this.cpuDebug) 
            console.log("[", "HW -", this.name, "ID:", this.id, "]:", message);
    }

    // used for mmu debugging
    protected mmuLog(message: String): void {
        
        if (this.mmuDebug) 
            console.log("[", "HW -", this.name, "ID:", this.id, "]:", message);
    }

    // used for keyboard debugging
    protected vkbLog(message: String): void {
        
        if (this.vkbDebug) 
            console.log("[", "HW -", this.name, "ID:", this.id, "]:", message);
    }

}