// ASCII class to be imported by our OS
export class Ascii {

    private byte: number = 0;
    private character: string = "";

    public byteToCharacter (byte: number): string {
        
        this.character = String.fromCharCode(byte);
        return this.character;
    }

    public characterToByte (character: string): number {

        this.byte = +character.charCodeAt(0).toString(16);
        return this.byte;
    }
}