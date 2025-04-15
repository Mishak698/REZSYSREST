const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));


const tables = [
    { id: 1, seats: 2, isAvailable: true },
    { id: 2, seats: 2, isAvailable: true },
    { id: 3, seats: 4, isAvailable: true },
    { id: 4, seats: 4, isAvailable: true },
    { id: 5, seats: 4, isAvailable: true },
    { id: 6, seats: 4, isAvailable: true },
    { id: 7, seats: 6, isAvailable: true },
    { id: 8, seats: 6, isAvailable: true },
    { id: 9, seats: 6, isAvailable: true }
];

let reservations = [];

function findBestTables(people) {
    const availableTables = tables.filter(table => table.isAvailable);
    const sortedTables = [...availableTables].sort((a, b) => b.seats - a.seats);
    
    let remainingPeople = people;
    const selectedTables = [];
    
    for (const table of sortedTables) {
        if (table.seats >= remainingPeople) {
            return [table];
        }
    }
    
    for (const table of sortedTables) {
        if (remainingPeople <= 0) break;
        if (table.seats <= remainingPeople) {
            selectedTables.push(table);
            remainingPeople -= table.seats;
        }
    }
    
    if (remainingPeople > 0) {
        return null;
    }
    
    return selectedTables;
}


function isValidTime(time) {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
}

app.post('/api/reserve', (req, res) => {
    const { people, date, time, duration } = req.body;
    
    if (!people || !date || !time || !duration) {
        return res.status(400).json({ error: 'Všechna pole jsou povinná' });
    }
    
    if (!isValidTime(time)) {
        return res.status(400).json({ error: 'Neplatný formát času. Použijte HH:MM (24-hodinový formát)' });
    }
    
    const numPeople = parseInt(people);
    if (isNaN(numPeople) || numPeople < 1) {
        return res.status(400).json({ error: 'Počet lidí musí být kladné číslo' });
    }
    
    const bestTables = findBestTables(numPeople);
    
    if (!bestTables || bestTables.length === 0) {
        return res.status(400).json({ error: 'Není dostatek volných míst' });
    }
    
    const reservation = {
        id: reservations.length + 1,
        people: numPeople,
        date,
        time,
        duration,
        tables: bestTables.map(table => table.id),
        createdAt: new Date()
    };
    
    bestTables.forEach(table => {
        const tableToUpdate = tables.find(t => t.id === table.id);
        if (tableToUpdate) tableToUpdate.isAvailable = false;
    });
    
    reservations.push(reservation);
    
    res.json({
        success: true,
        reservation,
        message: `Rezervace provedena na ${numPeople} lidí. Stůl ${bestTables.map(t => t.id).join(', ')}`
    });
});

app.post('/api/cancel/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const reservation = reservations.find(r => r.id === id);
    
    if (!reservation) {
        return res.status(404).json({ error: 'Rezervace nebyla nalezena' });
    }
    
    reservation.tables.forEach(tableId => {
        const table = tables.find(t => t.id === tableId);
        if (table) table.isAvailable = true;
    });
    
    reservations = reservations.filter(r => r.id !== id);
    
    res.json({ success: true, message: 'Rezervace byla zrušena' });
});

app.get('/api/reservations', (req, res) => {
    res.json(reservations);
});

app.get('/api/tables', (req, res) => {
    res.json(tables);
});

app.listen(PORT, () => {
    console.log(`Server běží na http://localhost:${PORT}`);
});