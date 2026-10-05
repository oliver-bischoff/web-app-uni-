import { Router } from 'express';
import { getCollection, ObjectId } from '../db/crudMongoDB.js';

import multer from "multer";
import path from "path";

const uploadDir = "public/images";

const locRouter = Router();
const collectionName = 'locations';

// Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueName = `loc-${Date.now()}${ext}`;
        cb(null, uniqueName);
    }
});

// Nur Bilder erlauben
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Nur Bilddateien erlaubt"), false);
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5mb
});

// get alle Locations
locRouter.get('/', async (req, res) => {
    try {
        const locs = await getCollection(collectionName);
        const allLocs = await locs.find().toArray();
        res.status(200).json(allLocs);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching locations");
    }
});

// get Location nach ID
locRouter.get('/:id', async (req, res) => {
    try {
        const locs = await getCollection(collectionName);
        const loc = await locs.findOne({ _id: new ObjectId(req.params.id) });
        if (!loc) return res.status(404).send("Location not found");
        res.status(200).json(loc);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching location");
    }
});

// POST neue Location
locRouter.post('/', upload.single("image"), async (req, res) => {
    try {
        const locs = await getCollection(collectionName);
        const newLoc = req.body;

        // Prüfen, ob ein Bild hochgeladen wurde
        if (req.file) {
            newLoc.image = `/images/${req.file.filename}`;
        } 

        // Location in DB speichern
        const result = await locs.insertOne(newLoc);

        // MongoDB _id hinzufügen
        newLoc._id = result.insertedId;

        // Ganze Location zurückgeben
        res.status(201).json(newLoc);

    } catch (err) {
        console.error(err);
        res.status(500).send("Error creating location");
    }
});

import fs from "fs";

// UPDATE Location
locRouter.post('/:id', upload.single("image"), async (req, res) => {
    try {
        const locs = await getCollection(collectionName);
        const locId = new ObjectId(req.params.id);

        const existingLoc = await locs.findOne({ _id: locId });
        if (!existingLoc) {
            return res.status(404).json({ error: "Location not found" });
        }

        const updatedLoc = {
            title: req.body.title,
            description: req.body.description,
            street: req.body.street,
            ZIP: req.body.ZIP,
            city: req.body.city,
            category: req.body.category,
            lat: Number(req.body.lat),
            lon: Number(req.body.lon),
            image: existingLoc.image || null
        };

        // neues Bild?
        if (req.file) {
            // altes Bild löschen
            if (existingLoc.image) {
                const oldPath = path.join("public", existingLoc.image);
                fs.unlink(oldPath, () => {});
            }
            updatedLoc.image = `/images/${req.file.filename}`;
        }

        await locs.updateOne({ _id: locId }, { $set: updatedLoc });

        const locFromDB = await locs.findOne({ _id: locId });
        res.status(200).json(locFromDB);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error updating location" });
    }
});

/*
// Location aktualisieren (PUT)
locRouter.put('/:id', async (req, res) => {
    try {
        const locs = await getCollection(collectionName);
        const locId = new ObjectId(req.params.id);

        const existingLoc = await locs.findOne({ _id: locId });
        if (!existingLoc) {
            return res.status(404).json({ error: "Location not found" });
        }

        // Neues Location-Objekt bauen
        const updatedLoc = {
            title: req.body.title,
            description: req.body.description,
            street: req.body.street,
            ZIP: req.body.ZIP,
            city: req.body.city,
            category: req.body.category,
            lat: Number(req.body.lat),
            lon: Number(req.body.lon),
            image: existingLoc.image || null
        };

        // Falls neues Bild hochgeladen wurde
        if (req.file) {
            // altes Bild löschen
            if (existingLoc.image) {
                const oldPath = path.join("public", "images", existingLoc.image);
                fs.unlink(oldPath, () => {});
            }
            updatedLoc.image = req.file.filename;
        }

        await locs.updateOne(
            { _id: locId },
            { $set: updatedLoc }
        );

        const locFromDB = await locs.findOne({ _id: locId });
        res.status(200).json(locFromDB);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error updating location" });
    }
});
*/

// DELETE komplette Location
locRouter.delete('/:id', async (req, res) => {
    try {
        const locs = await getCollection(collectionName);
        const locId = new ObjectId(req.params.id);
        
        const loc = await locs.findOne({ _id: locId });
        if (!loc) {
            return res.status(404).json({ error: "Location not found" });
        }

        // Bild löschen, falls vorhanden
        if (loc.image) {
            const imagePath = path.join("public", loc.image);
            fs.unlink(imagePath, () => {});
        }

        await locs.deleteOne({ _id: locId });
        res.status(200).json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting location");
    }
});

// DELETE nur Bild
locRouter.delete('/:id/image', async (req, res) => {
    try {
        const locs = await getCollection(collectionName);
        const locId = new ObjectId(req.params.id);

        const loc = await locs.findOne({ _id: locId });
        if (!loc || !loc.image) {
            return res.status(404).json({ error: "Kein Bild vorhanden" });
        }

        const imagePath = path.join("public", loc.image);
        await fs.promises.unlink(imagePath);

        await locs.updateOne(
            { _id: locId },
            { $unset: { image: "" } }
        );

        res.status(200).json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting image");
    }
});


export default locRouter;
