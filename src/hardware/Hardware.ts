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

    protected log(message: String): void {
        // TODO Lab 0: Create a logging message to be used by all child classes
        // There should be a "switch" (a local instance variable) that allows you to turn on and off debugging output
    }

}

