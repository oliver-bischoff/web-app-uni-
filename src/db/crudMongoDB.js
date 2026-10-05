import { MongoClient, ObjectId } from "mongodb";

const db_user = 'green_streets_berlin_user';
const db_pswd = 'etyXnYuZZ';
const db_name = 'green_streets_berlin';
const uri = `mongodb://${db_user}:${db_pswd}@mongodb1.f4.htw-berlin.de:27017/${db_name}`;

const client = new MongoClient(uri);

// getUsersCollection
async function getUsersCollection() {
    await client.connect();
    const db = client.db(db_name);
    return db.collection('users');
}

// findAllUsers
export async function findAllUsers() {
    const users = await getUsersCollection();
    return users.find().toArray();
}

// finOneUser
export async function findOneUser(username, password) {
    const users = await getUsersCollection();
    return users.findOne({ username, password });
}

// getCollection
export async function getCollection(name) {
    await client.connect();
    const db = client.db(db_name);
    return db.collection(name);
}

export { ObjectId, client };
