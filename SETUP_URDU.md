# CareSlot - Setup (Roman Urdu)

Ye project aap ke computer par chalane ke asaan steps hain.

## Pehle ye install hona chahiye
- Node.js 18 ya us se naya (nodejs.org)
- MongoDB: teen tareeqe, koi ek chunein
  1. Docker ho to project ke folder mein `docker compose up -d`
  2. MongoDB Community Server apne computer par install karein
  3. Free MongoDB Atlas cluster (cloud) bana kar uska connection string lein

## Server chalana
```bash
cd server
cp .env.example .env
```
`.env` file kholein aur `JWT_SECRET` mein koi lamba random text likhein. Agar Atlas use kar rahe hain to `MONGODB_URI` mein apna connection string daalein.

```bash
npm install
npm run seed     # demo doctors, admin aur patient ban jayenge
npm run dev      # server http://localhost:5000 par chalega
```

## Frontend chalana (naya terminal)
```bash
cd client
npm install
npm run dev      # website http://localhost:5173 par khulegi
```

## Demo login
| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@careslot.test | Admin@1234 |
| Doctor | ayesha@careslot.test | Doctor@1234 |
| Patient | patient@careslot.test | Patient@1234 |

## Test chalana
```bash
cd server
npm test
```

## Agar koi masla aaye
- `Missing environment variable` aaye to `.env` file bani hai ya nahi dekhein.
- `ECONNREFUSED` ya database connect na ho to MongoDB chal raha hai ya nahi, aur `MONGODB_URI` sahi hai ya nahi dekhein.
- Website par data na aaye to server chal raha hai ya nahi dekhein (terminal mein `API listening on port 5000` likha hona chahiye).

## Internship ke liye aage kya karna hai
1. Pehle local par poora chala kar dekhein aur har role (admin, doctor, patient) se login karein.
2. Project ko apne GitHub par daalein, README mein screenshots add karein.
3. README ke "Deploy for free" wale hisse se Atlas + Render + Vercel par live karein.
4. Live link CV aur email dono mein daalein.
5. Code ko samjhein, khaas kar README ka "How double booking is prevented" hissa. Interview mein yehi poocha jayega.
