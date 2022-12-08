export class HANDLEMANUALTASK {
        
    constructor(private order: string){

    }

    async processInitialized(){
        return {
            status:200,
            message: "OK",
            data: this.order
        }
    }

    async taskNotManual(){
        return {
            status:200,
            message: "Task not affected because is not manual.",
            data: this.order
        }
    }
}