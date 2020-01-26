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
    public debug: boolean = true;
    public date: Date = new Date();
    
    protected log(message: String): void {
        
        if (this.debug) 
            console.log("[", "HW -", this.name, "ID:", this.id, "-", this.date.getTime(), "]:", message);
    }

}