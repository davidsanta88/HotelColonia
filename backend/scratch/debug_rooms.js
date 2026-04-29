const mongoose = require('mongoose');

async function debug() {
    const uris = [
        'mongodb+srv://adminhotel:hotel2026@cluster0.zsiq9ye.mongodb.net/HotelDB?retryWrites=true&w=majority',
        'mongodb+srv://admin:HotelColonial2026@cluster0.d1nbr5v.mongodb.net/HotelColonialDB?retryWrites=true&w=majority'
    ];

    for (const uri of uris) {
        const conn = await mongoose.createConnection(uri).asPromise();
        console.log(`\n--- DB: ${uri.split('/').pop().split('?')[0]} ---`);
        
        // Let's check collections list first
        const collections = await conn.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        const stats = await conn.collection('habitacions').aggregate([
            {
                $lookup: {
                    from: 'estadohabitacions',
                    localField: 'estado',
                    foreignField: '_id',
                    as: 'info'
                }
            },
            { $unwind: '$info' },
            {
                $group: {
                    _id: '$info.nombre',
                    count: { $sum: 1 }
                }
            }
        ]).toArray();
        
        console.log('Stats:', stats);
        await conn.close();
    }
    process.exit();
}

debug();

