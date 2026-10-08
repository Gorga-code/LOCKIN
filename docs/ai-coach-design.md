Class Activity by Group: 12 Name/NPM: 

Fahmi Milan Amyar - 2406360060 Gorga Simatupang - 2406487020 Otniel Kristian Sianturi - 2406401571 

# **1. Feature Choice => AI Focus Coach & Smart Session Reflection System (A.I Study Assistant)** 

Fitur ini mengekstrak data dari sesi fokus solo (durasi, jumlah pause, log deteksi Media Pipe untuk keberadaan wajah & ponsel, serta override allowlist situs) untuk memberikan ringkasan refleksi yang terpersonalisasi, mengevaluasi pola distraksi, dan memberikan saran perbaikan kebiasaan belajar secara otomatis tanpa mengganggu privasi pengguna. 

User story: As a university student using the Focus & Accountability app, 

I want to analyze my session distraction patterns, goal completion, and study habits after each session, so that I can gain personalized insights into my interruptions, stay accountable, and continuously improve my study routine over time. 

## **Sample Queries:** 

- Why did I lose focus during my math assignment yesterday? 

- Summarize my study habits for this week and suggest the best time for me to do deep work. 

# **2. A system architecture sketch using AI building blocks :** 

<u>https://canva.link/0afgpyi5veymji7</u> 



<!-- Start of picture text -->
USER CLIENT SIDE<br>Chrome Extension React Frontend App<br>URL Monitor MediaPipe Vision Pipeline<br>* Check Allowlist © Face Presence Detector<br>.SR Model<br>Session Manager<br>* Timer & Pauses<br>* Local Data Aggregator<br>Y Session Payload<br>Secure API Gateway<br>BACKEND &AICLOUD J<br>FastAPI / Node Service 5 Postgres DB<br>. “ty Store ¢ User Profiles & Logs<br>Al Reflection Engine<br>* Prompt Context Construction<br>© Trend Analysis<br>LLM Orchestrator<br>¢ Structured JSON Output<br><!-- End of picture text -->

Data Knowledge: 

- What data is needed: Session metadata di store di postgreSQL, misalkan for data such as: 

   - planned/elapsed time 

   - Pauses, 

   - Phone detection 

   - Timestamps 

- How is it stored?: 

   - Supabase most likely 

   - And retrieved via <u>Next.js</u> Route Handlers 

- ETL/Pipelines (Station 1): The raw event logs need to be formatted into structured **JSON summaries** before being fed to the LLM to save token costs and provide clear context. 

Models: 

- Local Models: MediaPipe Tasks Vision (Face Detector and Object Detector) running locally to ensure privacy, fast processing, and low CPU load. 

- API Models: An LLM API (e.g., OpenAI or Gemini) as the reasoning layer to generate the end-of-session reflection summaries. 

# **Detailed Architecture** 



<!-- Start of picture text -->
epee<br>erescacao oe boas<br>+ Override Logger \<br>session anager Cnt) )<br>Loca Sats aeh Ra i)<br>‘SotiorPoec<br>J<br>‘Recon Eg Tool Cling<br>\Nextjs Route Handlers “Trigger Retiection 7 + Trend Analysis (RAG) "rome<br>|\<br>|\<br>Jj \ Corcoran<br>\ + Opendl text-embedding-3-smail<br>Me \ | cart*OpenAl/seus Anthropic Shon Mode! taco<br>+RowDuy LevelEnteige Secury anery (RLS) \|<br>| 3, RESPONSIBLE Al &GUARDRAILS |<br><!-- End of picture text -->

# **Overview** 



<!-- Start of picture text -->
Session logs ~ ETL ~ JSON summaries .{ Data & knowledge<br>1) SESSION DATA & CONTEXT<br>(2) LOCALMediaPipe & CLOUD MODELSTasks Vision Embedding model + LLM API «| Model layer<br>3) EndPOST-SESSIONSession + JSON WORKFLOW+ RAG+ LLM. | Inference & orchestration<br>(4)A APPNextjs& / DASHBOARDReact + Chrome extension «{ Application integration<br>5 QUALITY & FEEDBACK<br><!-- End of picture text -->

## **Architecture Canvas:** 

- **User & Use Case** 

University students reviewing study sessions, identifying interruption patterns, and receiving personalized suggestions to improve study habits. 

- **Data & Knowledge** 

Task goals, session duration, pauses, face/phone events, website overrides, and reported goal completion. Store metadata in Supabase PostgreSQL, prepare JSON summaries, and retrieve relevant history from the past 14 days using embeddings and pgvector. 

- **Models** 

Local MediaPipe Face and Object Detectors for presence and visible phones. An embedding model supports retrieval, while an LLM API generates reflections. No custom model training is required. 

- **Orchestration** 

**End Session → Next.js Route Handlers → JSON summary + history retrieval → LLM → structured reflection.** Processing runs asynchronously after the session. 

- **Application Integration** 

Next.js, React, and TypeScript power the interface. The Chrome extension 

manages website rules. Supabase provides authentication and storage. The dashboard displays reflections, suggestions, and session history. 

- **Evaluation & Guardrails** 

Measure generation latency, factual accuracy, detection errors, and user feedback. Require camera consent, keep video local, protect records with Row Level Security, and provide supportive guidance without calling recorded time verified productivity. 

# **3. Three Key Technical Decisions & Trade-offs** 

a. Decision 1: MediaPipe Tasks Vision vs Cloud Video Streaming 

Keputusan => Menggunakan model computer vision ringan (MediaPipe Tasks Vision) yang berjalan secara lokal pada browser client untuk mendeteksi keberadaan wajah dan ponsel. 

Trade-off => Membutuhkan sebagian kecil daya komputasi perangkat client, tetapi memberikan privasi 100% (aliran video mentah tidak pernah diunggah/direkam ke server atau LLM) serta mengeliminasi biaya bandwidth/cloud vision API yang sangat mahal. 

- b. Decision 2: RAG menggunakan Supabase pgvector vs. Fine-tuning Custom LLM 

Keputusan => Menggunakan teknik Retrieval-Augmented Generation berbasis embeddings yang disimpan dalam Supabase PostgreSQL (pgvector) untuk mengambil tren sesi belajar pengguna selama 14 hari terakhir. 

Trade-off => Menghindari biaya tinggi dan kompleksitas maintenance fine-tuning model LLM custom, sekaligus memastikan data riwayat pengguna terisolasi menggunakan Row Level Security di PostgreSQL 

- c. Decision 3: Asynchronous Post-Session Processing vs Real-Time Streaming LLM Execution 

Keputusan => Eksekusi analisis LLM dilakukan secara asynchronous (setelah pengguna menekan tombol End Session) melalui Next.js Route Handlers, bukan secara real-time terus-menerus selama sesi fokus berjalan. Trade-off => AI tidak memberikan respons percakapan teks real-time setiap detik saat fokus (berisiko mengganggu konsentrasi pengguna), melainkan menghemat penggunaan memori/prosesor laptop pengguna selama sesi fokus berlangsung dan menyajikan analisis komprehensif di akhir sesi. 

# **4. Responsible AI & Guardrails** 

Sesuai prinsip _privacy-by-design_ dan etika kecerdasan buatan, sistem ini menjamin bahwa seluruh pemrosesan _video_ kamera dari _MediaPipe Tasks Vision_ 

dieksekusi secara lokal di perangkat pengguna dan aliran _video_ mentah **tidak pernah diunggah atau disimpan** ke _server_ maupun API LL. Data yang dikirimkan ke modul AI hanyalah metadata anonim berupa stempel waktu ( _timestamps_ ) kejadian distraksi, durasi sesi, dan ringkasan target belajar. Akses terhadap riwayat refleksi dilindungi oleh _Row Level Security_ (RLS) di Supabase sehingga hanya pemilik akun terautentikasi yang dapat mengakses datanya. Selain itu, instruksi sistem ( _system prompt_ ) dirancang agar asisten AI bersikap suportif dan non-punitif, serta dilarang keras melabeli waktu di depan kamera secara sepihak sebagai _"verified productive time"_ . 

Metrics: Latency of AI generation, precision of the LLM accurately recalling session durations, and user feedback (thumbs up/down). Track false-alert rates and missed events for the local CV model. 

Risks & mitigation: 

- Risk: The AI hallucinates data or the local CV model drops frames. 

- Mitigation: Strict prompt engineering for the LLM; benchmark device CPU load and offer a camera-off mode for the CV model. 

Safety rules: Never transmit raw video feeds or personal identity data to the cloud/LLM provider. Keep all camera processing local and apply Row Level Security to all user-owned database tables. 

# **5. Reflection** 

A.I sangat penting untuk buat sesuai understanding yang kita punya, karena kalau tidak maka bisa menghasilkan results yang devastating. Jadi ini mulai dari jenis A.I yang kita akan menggunakan sehingga guardrails yang kita taruh padanya. Selain itu, Architecture dari A.I ternyata banyak dan panjang sekali, maka kita harus beneran memberikan perhatian pada setiap bagian tersebut. 

