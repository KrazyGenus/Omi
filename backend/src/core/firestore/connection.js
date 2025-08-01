const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue, Filter } = require('firebase-admin/firestore');
const serviceAccount = require('/home/krazygenus/Desktop/blip-user-inference-results-2e8111c9166b.json');


/**
 *
 */
class Connection {
    constructor () {
        try {
            initializeApp({
                credential: cert(serviceAccount)
                });
        } catch (error) {
            reject(error);
        }
    }
/**
 * An async function with the sole purpose of retrieving the Firestore instance, created by the SDK
 * @returns An instance of FireStore
 */
    async getConnection() {
        try {
            return new Promise((resolve) => {
                this.db = getFirestore();
                resolve(this.db);
            })
        } catch (error) {
            console.log('Error encoutered during get connection', error);
        }
    }

    /**
     * This async function is intended to serve the purpose of saving into the collections:
     *  -- audioViolations
     *  -- visualViolations 
     * @param {*} userId 
     * @param {*} collection 
     * @param {*} documentId A UUID unique to each upload but shared between the audio and visual violations
     * @param {*} payload  The response returned after inference has completed
     * @returns A boolean to signify sucess or not
     */
    async createOrUpdateDocument(userId, jobId, collection='', payload) {
        const fireStoreDB = await this.getConnection();
        try {
            console.log('Input info at createorupdate function', typeof(userId), typeof(jobId), typeof(collection));
            const processedUserId = String(userId).trim();
            const processedJobId = String(jobId).trim();
            const processedCollection = String(collection).trim();


        
           const docRef = fireStoreDB
                .collection('users')
                .doc(processedUserId)
                .collection(processedCollection)
                .doc(processedJobId);
           const docSnapShot = await docRef.get();
           if (docSnapShot.exists) {
            try {
                if (collection === 'visualViolations'){ await docRef.update({'flagged_frames' : FieldValue.arrayUnion(...payload)}); }
                else if (collection === 'audioViolations') {  await docRef.update({ 'audio_violations': FieldValue.arrayUnion(...payload) }); }
                return { update: true }
            } catch (error) {
                console.log('Error during update of document', error);
            }
           }

           else {
            try {
                if (collection === 'visualViolations'){await docRef.set({ 'flagged_frames': payload });}
                else if (collection === 'audioViolations') {await docRef.set({ 'audio_violations': payload });}
                return  { save: true }
            } catch (error) {
                console.log('Error during setting of document', error);
            }
           }
        } catch (error) {
            console.log('Error when trying to saved object to db', error);
            return { save: false };
        }
    }

    /**
     * 
     * @param {*} collection 
     * @param {*} documentId 
     */
    async readDataFromFireStoreSingle(collection='', documentId ='') {}
    


    /**
     * 
     * @param {*} collection 
     * @param {*} documentId 
     */
    async readDataFromFireStoreBulk(collection='', documentId ='') {}




    /**
     * 
     * @param {*} collection 
     */
    async readDataFromFireStoreBulkAll(collection='') {}



    /**
     * 
     * @param {*} collection 
     * @param {*} documentId 
     */
    async deleteDataFromFireStoreSingle(collection='', documentId='') {}

    
    
    /**
     * 
     * @param {*} collection 
     */
    async purgeDataFromFireStore(collection='') {}
}

const fireStoreClient = new Connection();
module.exports  = { fireStoreClient, serviceAccount };