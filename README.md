# Video Forge 🎥

A scalable, asynchronous video transcoding engine built for the AlgoHire Hackathon.  
This system handles high-load video processing by decoupling the API from the worker nodes, allowing for horizontal scaling and fault tolerance.

---

## 🚀 Features

- **Asynchronous Processing**  
  API handles uploads immediately; workers process videos in the background.

- **Cartesian Product Job Logic**  
  Users can select multiple formats (MP4 / WebM) and resolutions (480p / 720p / 1080p), generating parallel transcoding jobs.

- **Horizontal Scaling**  
  Multiple `worker.js` instances can be run concurrently to process jobs faster.

- **Smart Queue Management**  
  PostgreSQL row-level locking ensures thread safety and prevents duplicate job processing.

- **Optimized FFmpeg Presets**
  - **V2 (WebM):** Row-based multithreading with realtime deadlines for maximum CPU utilization.
  - **V1 (MP4):** Ultrafast presets for quick turnaround.

- **Real-Time Status Polling**  
  Frontend reflects actual database state without fake progress bars.

---

## 🛠️ Tech Stack

- **Frontend:** React (Vite), Axios  
- **Backend:** Node.js, Express, Multer  
- **Database:** PostgreSQL  
- **Processing:** FFmpeg, Fluent-FFmpeg  
- **Architecture:** Producer–Consumer Pattern  



