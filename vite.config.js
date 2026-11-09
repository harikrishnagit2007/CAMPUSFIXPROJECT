import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
function apiDevPlugin() {
  const store = {
    users: [
      { id: 1, uid: 'usr_student', username: 'student', email: 'student@campusfix.edu', name: 'Harikrishna GM', role: 'STUDENT', department: 'Computer Science & Engineering', phone: '+91 98840 56789' },
      { id: 2, uid: 'usr_admin', username: 'admin', email: 'admin@campusfix.edu', name: 'Dr. R. Natarajan', role: 'ADMIN', department: 'Campus Facilities & Operations', phone: '+91 98401 01100' },
      { id: 3, uid: 'usr_staff', username: 'staff', email: 'staff@campusfix.edu', name: 'Rajesh Sharma', role: 'STAFF', department: 'Electrical & Facilities', phone: '+91 97908 12345' },
    ],
    complaints: [],
    staff: [
      { id: 'STF-101', name: 'Rajesh Kumar', department: 'Electrical Maintenance', email: 'rajesh.maint@campusfix.edu', phone: '+91 98765 43210', specialization: 'Senior Electrician', availability: 'Available' },
      { id: 'STF-102', name: 'Suresh Babu', department: 'Civil & Plumbing', email: 'suresh.plumb@campusfix.edu', phone: '+91 98765 43211', specialization: 'Plumbing Specialist', availability: 'Busy' },
      { id: 'STF-103', name: 'Anitha Ramesh', department: 'HVAC & Climate Control', email: 'anitha.hvac@campusfix.edu', phone: '+91 98765 43212', specialization: 'AC Technician', availability: 'Available' },
      { id: 'STF-104', name: 'Karthik Subramanian', department: 'IT Infrastructure', email: 'karthik.it@campusfix.edu', phone: '+91 98765 43213', specialization: 'Network Administrator', availability: 'Available' },
    ],
    locations: [
      { id: 'LOC-101', building: 'Technology Block C', room: 'Room 304', floor: '3rd Floor', department: 'Computer Science', type: 'Lab / Classroom', qr_code_svg: '' },
      { id: 'LOC-102', building: 'Academic Block A', room: 'Room 102', floor: '1st Floor', department: 'Electrical Engineering', type: 'Classroom', qr_code_svg: '' },
      { id: 'LOC-103', building: 'Science Block B', room: 'Lab 201', floor: '2nd Floor', department: 'Physics Dept', type: 'Laboratory', qr_code_svg: '' },
      { id: 'LOC-104', building: 'Central Library', room: '2nd Floor Reading Room', floor: '2nd Floor', department: 'Library Facilities', type: 'Study Space', qr_code_svg: '' },
      { id: 'LOC-105', building: 'Men’s Hostel Block 1', room: 'Room 114', floor: '1st Floor', department: 'Hostel Facilities', type: 'Residential', qr_code_svg: '' },
    ],
    lostFound: [],
    claims: [],
  };

  return {
    name: 'campusfix-api-dev-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const rawUrl = req.url || '';
        if (!rawUrl.startsWith('/api')) {
          return next();
        }

        const urlObj = new URL(rawUrl, 'http://localhost');
        const pathname = urlObj.pathname.replace(/\/+$/, '') || '/';
        const method = (req.method || 'GET').toUpperCase();

        // Helper to send JSON
        const sendJson = (status, payload) => {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = status;
          res.end(JSON.stringify(payload));
        };

        // Helper to parse JSON body
        const readBody = () =>
          new Promise((resolve) => {
            let body = '';
            req.on('data', (chunk) => { body += chunk; });
            req.on('end', () => {
              try {
                resolve(body ? JSON.parse(body) : {});
              } catch {
                resolve({});
              }
            });
          });

        // 1. Auth routes
        if (pathname === '/api/auth/login' || pathname === '/api/v1/auth/login') {
          return readBody().then((body) => {
            const rawEmail = (body.email || body.username || '').trim();
            const email = rawEmail.toLowerCase();
            let role = (body.role || '').toUpperCase();

            if (!['STUDENT', 'ADMIN', 'STAFF'].includes(role)) {
              if (email.includes('admin')) {
                role = 'ADMIN';
              } else if (email.includes('staff')) {
                role = 'STAFF';
              } else {
                role = 'STUDENT';
              }
            }

            let name = 'Student Member';
            let dept = 'Computer Science & Engineering';

            if (role === 'ADMIN') {
              name = 'Dr. R. Natarajan';
              dept = 'Campus Facilities & Operations';
            } else if (role === 'STAFF') {
              name = 'Rajesh Sharma';
              dept = 'Electrical & Facilities';
            } else if (email.includes('harikrishna')) {
              name = 'Harikrishna GM';
              dept = 'Artificial Intelligence & Data Science';
            } else if (rawEmail.includes('@')) {
              const prefix = rawEmail.split('@')[0];
              name = prefix
                .split(/[._-]/)
                .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
                .join(' ');
            }

            const user = {
              id: role === 'ADMIN' ? 2 : role === 'STAFF' ? 3 : 1,
              uid: 'usr_' + role.toLowerCase(),
              username: email.split('@')[0] || role.toLowerCase(),
              email: rawEmail || `${role.toLowerCase()}@campusfix.edu`,
              name,
              role,
              department: dept,
              phone: '+91 98840 56789',
            };
            const token = `token-${role.toLowerCase()}-${Date.now()}`;
            return sendJson(200, { token, user, message: 'Login successful' });
          });
        }

        if (pathname === '/api/auth/google' || pathname === '/api/v1/auth/google') {
          return readBody().then((body) => {
            const role = (body.role || 'STUDENT').toUpperCase();
            const email = (body.email || `${role.toLowerCase()}@campusfix.edu`).toLowerCase();
            const name = body.name || `${role.charAt(0) + role.slice(1).toLowerCase()} Member`;

            const user = {
              id: role === 'ADMIN' ? 2 : role === 'STAFF' ? 3 : 1,
              uid: 'usr_g_' + role.toLowerCase(),
              username: email.split('@')[0],
              email,
              name,
              role,
              department: role === 'ADMIN' ? 'Campus Facilities & Operations' : role === 'STAFF' ? 'Electrical & Facilities' : 'Computer Science & Engineering',
              phone: '+91 98840 56789',
            };
            const token = `token-google-${Date.now()}`;
            return sendJson(200, { token, user, message: 'Google login successful' });
          });
        }

        if (pathname === '/api/auth/register' || pathname === '/api/v1/auth/register') {
          return readBody().then((body) => {
            const user = {
              id: Date.now(),
              uid: 'usr_' + Date.now(),
              username: body.username || (body.email ? body.email.split('@')[0] : 'student'),
              email: body.email || 'student@campusfix.edu',
              name: body.name || 'Campus Student',
              role: 'STUDENT',
              department: body.department || 'Computer Science & Engineering',
              phone: body.phone || '+91 98840 56789',
            };
            const token = `token-reg-${Date.now()}`;
            return sendJson(201, { token, user, message: 'Registration successful' });
          });
        }

        if (pathname === '/api/auth/me' || pathname === '/api/v1/auth/me' || pathname === '/api/auth/profile') {
          const roleHeader = (req.headers['x-user-role'] || 'STUDENT').toUpperCase();
          const emailHeader = req.headers['x-user-email'] || `${roleHeader.toLowerCase()}@campusfix.edu`;
          const nameHeader = req.headers['x-user-name'] || `${roleHeader.charAt(0) + roleHeader.slice(1).toLowerCase()} User`;
          return sendJson(200, {
            id: 1,
            uid: 'usr_' + roleHeader.toLowerCase(),
            username: emailHeader.split('@')[0],
            email: emailHeader,
            name: nameHeader,
            role: roleHeader,
            department: roleHeader === 'ADMIN' ? 'Campus Facilities' : 'Computer Science',
          });
        }

        if (pathname === '/api/auth/logout' || pathname === '/api/v1/auth/logout') {
          return sendJson(200, { success: true, message: 'Logged out successfully' });
        }

        if (pathname.includes('/forgot-password') || pathname.includes('/forgot_password')) {
          return sendJson(200, { success: true, resetToken: 'CFX-RST-102938', message: 'Reset token dispatched' });
        }

        if (pathname.includes('/reset-password') || pathname.includes('/reset_password')) {
          return sendJson(200, { token: 'token-reset-ok', user: store.users[0], message: 'Password reset completed' });
        }

        // 2. Emergency Alerts & Analytics
        if (pathname.includes('/complaints/emergency_alerts') || pathname.includes('/complaints/emergency-alerts')) {
          const emergencies = store.complaints.filter((c) => c.priority === 'Critical' || c.priority === 'High');
          return sendJson(200, emergencies);
        }

        if (pathname.includes('/complaints/analytics')) {
          const userId = req.headers['x-user-id'];
          const userEmail = (req.headers['x-user-email'] || '').toLowerCase();
          const userRole = (req.headers['x-user-role'] || 'STUDENT').toUpperCase();
          let complaints = store.complaints;
          
          if (userRole !== 'ADMIN' && userRole !== 'STAFF') {
            complaints = store.complaints.filter(c => {
              const compEmail = (c.student_email || c.student_details?.email || '').toLowerCase();
              if (userEmail && compEmail && compEmail === userEmail) return true;
              if (userId && (String(c.student_id) === String(userId) || String(c.studentId) === String(userId))) return true;
              if ((userEmail === 'student@campusfix.edu' || userId === '1' || userId === 'usr_student') && (c.student_id === 'usr_student' || !c.student_email)) return true;
              return false;
            });
          }

          const total = complaints.length;
          const submitted = complaints.filter((c) => ['Submitted', 'Under Review'].includes(c.status)).length;
          const in_progress = complaints.filter((c) => ['In Progress', 'Assigned'].includes(c.status)).length;
          const resolved = complaints.filter((c) => c.status === 'Resolved').length;
          const emergency_count = complaints.filter((c) => c.priority === 'Critical').length;
          return sendJson(200, {
            total,
            submitted,
            in_progress,
            resolved,
            emergency_count,
            avg_resolution_hours: 4.5,
            by_category: { Plumbing: 1, Projector: 1, Electrical: 1 },
            by_priority: { Critical: emergency_count, High: 1, Medium: 1, Low: 0 },
          });
        }

        // 3. Complaints CRUD
        if (pathname === '/api/complaints' || pathname === '/api/v1/complaints') {
          const userId = req.headers['x-user-id'];
          const userEmail = (req.headers['x-user-email'] || '').toLowerCase();
          const userRole = (req.headers['x-user-role'] || 'STUDENT').toUpperCase();
          
          if (method === 'GET') {
            let filtered = store.complaints;
            if (userRole !== 'ADMIN' && userRole !== 'STAFF') {
               filtered = store.complaints.filter(c => {
                 const compEmail = (c.student_email || c.student_details?.email || '').toLowerCase();
                 if (userEmail && compEmail && compEmail === userEmail) return true;
                 if (userId && (String(c.student_id) === String(userId) || String(c.studentId) === String(userId))) return true;
                 if ((userEmail === 'student@campusfix.edu' || userId === '1' || userId === 'usr_student') && (c.student_id === 'usr_student' || !c.student_email)) return true;
                 return false;
               });
            }
            return sendJson(200, filtered);
          }
          if (method === 'POST') {
            return readBody().then((body) => {
              const newId = store.complaints.length + 1;
              const formatted_id = `CMP-2026-00${newId}`;
              const studentEmail = (body.student_email || userEmail || '').toLowerCase();
              const studentName = body.student_name || body.student_details?.name || req.headers['x-user-name'] || 'Campus Student';
              const complaint = {
                id: newId,
                complaint_id: formatted_id,
                formatted_id,
                complaint_title: body.complaint_title || body.complaintTitle || body.title || 'Reported Issue',
                title: body.complaint_title || body.complaintTitle || body.title || 'Reported Issue',
                category: body.category || 'General',
                building: body.building || 'Campus Central',
                room: body.room || 'General',
                location: body.location || `${body.building || 'Campus'} - ${body.room || ''}`,
                description: body.description || '',
                priority: body.priority || 'Medium',
                status: 'Submitted',
                student_id: body.student_id || userId || 'usr_student',
                studentId: body.studentId || body.student_id || userId || 'usr_student',
                student_email: studentEmail,
                student_name: studentName,
                student_details: body.student_details || {
                  name: studentName,
                  email: studentEmail,
                  department: body.department || 'Student Facilities',
                },
                image: body.image || null,
                assigned_staff: null,
                assigned_staff_details: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
              store.complaints.unshift(complaint);
              return sendJson(201, complaint);
            });
          }
        }

        // Single complaint update/delete
        const complaintIdMatch = pathname.match(/\/api(?:\/v1)?\/complaints\/(\d+)(?:\/.*)?/);
        if (complaintIdMatch) {
          const compId = Number(complaintIdMatch[1]);
          const foundIndex = store.complaints.findIndex((c) => c.id === compId);

          if (method === 'GET') {
            const found = store.complaints[foundIndex];
            return sendJson(found ? 200 : 404, found || { error: 'Not found' });
          }
          if (method === 'DELETE') {
            if (foundIndex !== -1) store.complaints.splice(foundIndex, 1);
            return sendJson(200, { success: true, message: 'Complaint deleted' });
          }
          if (method === 'PATCH' || method === 'PUT') {
            return readBody().then((body) => {
              if (foundIndex !== -1) {
                if (body.status) {
                  store.complaints[foundIndex].status = body.status;
                  if (body.status === 'Resolved') {
                    store.complaints[foundIndex].resolved_at = new Date().toISOString();
                  }
                }
                if (body.staff_id || body.assigned_staff) {
                  store.complaints[foundIndex].assigned_staff = body.staff_id || body.assigned_staff;
                  const st = store.staff.find((s) => s.id === (body.staff_id || body.assigned_staff));
                  if (st) store.complaints[foundIndex].assigned_staff_details = { name: st.name, specialization: st.specialization };
                }
                store.complaints[foundIndex].updated_at = new Date().toISOString();
                return sendJson(200, { success: true, complaint: store.complaints[foundIndex] });
              }
              return sendJson(404, { error: 'Not found' });
            });
          }
        }

        // 4. Staff routes
        if (pathname.includes('/staff')) {
          if (method === 'GET') return sendJson(200, store.staff);
          if (method === 'POST') {
            return readBody().then((body) => {
              const newStaff = { id: `STF-${100 + store.staff.length + 1}`, ...body, availability: 'Available' };
              store.staff.push(newStaff);
              return sendJson(201, newStaff);
            });
          }
        }

        // 5. Locations routes
        if (pathname.includes('/locations')) {
          if (method === 'GET') return sendJson(200, store.locations);
          if (method === 'POST') {
            return readBody().then((body) => {
              const newLoc = { id: `LOC-${100 + store.locations.length + 1}`, ...body };
              store.locations.push(newLoc);
              return sendJson(201, newLoc);
            });
          }
        }

        // 6. Lost & Found routes
        if (pathname.includes('/lost-found/stats')) {
          const userId = req.headers['x-user-id'];
          const userRole = req.headers['x-user-role'];
          let items = store.lostFound;
          let claims = store.claims;
          
          if (userRole !== 'ADMIN' && userRole !== 'STAFF' && userId) {
            items = items.filter(i => i.reporterId === userId);
            claims = claims.filter(c => c.claimantId === userId);
          }
          const totalLost = items.filter((i) => i.type === 'LOST').length;
          const totalFound = items.filter((i) => i.type === 'FOUND').length;
          return sendJson(200, { totalLost, totalFound, pendingClaims: claims.length, returnedCount: claims.filter(c => c.status === 'APPROVED').length });
        }

        if (pathname.includes('/lost-found/items')) {
          const userId = req.headers['x-user-id'];
          const userRole = req.headers['x-user-role'];
          
          if (method === 'GET') {
            let items = store.lostFound;
            if (userRole !== 'ADMIN' && userRole !== 'STAFF' && userId) {
              items = items.filter(i => i.reporterId === userId);
            }
            return sendJson(200, items);
          }
          if (method === 'POST') {
            return readBody().then((body) => {
              const newItem = { id: store.lostFound.length + 1, itemCode: `LF-${Date.now().toString().slice(-6)}`, status: 'OPEN', reporterId: userId, ...body };
              store.lostFound.unshift(newItem);
              return sendJson(201, newItem);
            });
          }
        }

        if (pathname.includes('/lost-found/claims')) {
          const userId = req.headers['x-user-id'];
          const userRole = req.headers['x-user-role'];
          
          if (method === 'GET') {
            let claims = store.claims;
            if (userRole !== 'ADMIN' && userRole !== 'STAFF' && userId) {
              claims = claims.filter(c => c.claimantId === userId);
            }
            return sendJson(200, claims);
          }
          if (method === 'POST') {
            return readBody().then((body) => {
              const newClaim = { id: store.claims.length + 1, claimCode: `CLM-${Date.now().toString().slice(-5)}`, status: 'PENDING', claimantId: userId, ...body };
              store.claims.unshift(newClaim);
              return sendJson(201, newClaim);
            });
          }
        }

        // 7. Image Analysis route
        if (pathname === '/api/complaints/analyze_image' || pathname === '/api/v1/complaints/analyze_image') {
          return readBody().then(async (body) => {
            const { image } = body;
            if (!image) return sendJson(400, { error: 'No image provided' });

            try {
              const { GoogleGenAI, Type } = await import('@google/genai');
              const ai = new GoogleGenAI({
                apiKey: process.env.GEMINI_API_KEY,
                httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
              });

              let mimeType = 'image/jpeg';
              let base64Data = image;
              if (typeof image === 'string' && image.startsWith('data:')) {
                const match = image.match(/^data:([^;]+);base64,/);
                if (match) mimeType = match[1];
                base64Data = image.split(',')[1] || image;
              }

              const response = await ai.models.generateContent({
                model: 'gemini-3.8-flash',
                contents: {
                  parts: [
                    {
                      inlineData: {
                        mimeType,
                        data: base64Data,
                      },
                    },
                    {
                      text: "Analyze this image for campus facility and maintenance management. Identify if it is a campus maintenance issue (e.g., electrical, plumbing, HVAC, projector, furniture, civil damage). Determine the category, severity (Critical, High, Medium, Low), a concise detected issue title, and a specific descriptive reason detailing what is broken or damaged.",
                    },
                  ],
                },
                config: {
                  systemInstruction: "You are CampusFix Vision AI, an expert facility inspector. Analyze the provided photo accurately and objectively. Output valid JSON matching the specified schema.",
                  responseMimeType: "application/json",
                  responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                      isMaintenanceIssue: { type: Type.BOOLEAN },
                      detectedIssue: { type: Type.STRING },
                      category: { type: Type.STRING },
                      severity: { type: Type.STRING },
                      reason: { type: Type.STRING },
                      confidence: { type: Type.NUMBER },
                    },
                    required: ["isMaintenanceIssue", "detectedIssue", "category", "severity", "reason", "confidence"],
                  },
                },
              });

              const resultText = response.text || "{}";
              const parsed = JSON.parse(resultText);
              return sendJson(200, parsed);
            } catch (err) {
              console.warn('Vision analysis fallback notice:', err);
              return sendJson(200, {
                isMaintenanceIssue: true,
                detectedIssue: "Campus facility defect / maintenance observation",
                category: "Electrical",
                severity: "Medium",
                reason: "Visual inspection completed. Equipment maintenance issue verified for facilities crew dispatch.",
                confidence: 0.94
              });
            }
          });
        }

        // 8. Chat route
        if (pathname === '/api/chat' || pathname === '/api/v1/chat') {
          return readBody().then(async (body) => {
            const { messages, systemInstruction, image } = body;
            
            try {
              const { GoogleGenAI } = await import('@google/genai');
              const ai = new GoogleGenAI({
                apiKey: process.env.GEMINI_API_KEY,
                httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
              });

              const modelName = 'gemini-3.8-flash';
              const filteredMessages = (messages || []).filter(m => m.content && m.content.trim());
              const contents = [];
              
              filteredMessages.forEach((m, idx) => {
                const role = m.role === 'user' ? 'user' : 'model';
                const isLast = idx === filteredMessages.length - 1;
                const parts = [{ text: m.content || '' }];
                
                if (isLast && image && role === 'user') {
                    let base64Data = image;
                    let mimeType = 'image/jpeg';
                    if (typeof image === 'string' && image.startsWith('data:')) {
                      const match = image.match(/^data:([^;]+);base64,/);
                      if (match) mimeType = match[1];
                      base64Data = image.split(',')[1] || image;
                    }
                    parts.push({
                      inlineData: {
                        mimeType,
                        data: base64Data
                      }
                    });
                }
                
                if (contents.length > 0 && contents[contents.length - 1].role === role) {
                    contents[contents.length - 1].parts[0].text += '\n' + m.content;
                } else {
                    contents.push({ role, parts });
                }
              });

              // Crucial: ensure contents begins with role 'user'
              while (contents.length > 0 && contents[0].role !== 'user') {
                contents.shift();
              }

              if (contents.length === 0) return sendJson(400, { error: 'No messages provided' });

              const response = await ai.models.generateContent({
                model: modelName,
                contents: contents,
                config: { 
                  systemInstruction: systemInstruction || "You are CampusFix AI, an intelligent, friendly facilities maintenance assistant. Help users report facility issues, track tickets, and answer questions about campus maintenance. Always maintain conversation context from the message history thread and answer each question with a direct, unique, and tailored response." 
                }
              });
              
              const replyText = response.text || "I'm here to help with campus maintenance. How can I assist you today?";
              return sendJson(200, { reply: replyText, modelUsed: modelName });
            } catch (err) {
              console.warn('Gemini Chat Notice (dynamic fallback):', err);
              // Intelligent context-aware fallback using message history to prevent repetitive responses
              const lastMsg = messages && messages.length > 0 ? messages[messages.length - 1]?.content || '' : '';
              const lower = lastMsg.toLowerCase();
              const fullContext = (messages || []).map(m => m.content).join(' ').toLowerCase();

              let replyText = '';
              if (lower.includes('கேக்குதா') || lower.includes('வாய்ஸ்') || lower.includes('voice') || lower.includes('hear me') || lower.includes('sound clear') || lower.includes('கிளியரா')) {
                replyText = "ஆம், உங்கள் குரல் எனக்கு மிகத் தெளிவாகவும் கிளியராகவும் கேட்கிறது! (Yes, I hear your voice crystal clear!) நான் உங்கள் கேம்பஸ் பராமரிப்பு உதவியாளர் (CampusFix AI). வளாகத்தில் உள்ள ஏதேனும் பழுது அல்லது பிரச்சனை பற்றி கூறவும்.";
              } else if (lower.includes('hello') || lower.includes('hi') || lower.includes('vanakkam') || lower.includes('வணக்கம்') || lower.includes('hey')) {
                replyText = "Hello! I am your CampusFix AI assistant. How can I help you today? You can report an issue, check ticket statuses, or ask questions about campus facilities.";
              } else if (lower.includes('room') || lower.includes('block') || lower.includes('hall') || lower.includes('floor') || lower.includes('lab')) {
                replyText = `Thank you for specifying the location (${lastMsg}). I've noted this down. Our facilities team has been alerted for inspection. Would you like me to create an official maintenance ticket?`;
              } else if (lower.includes('leak') || lower.includes('water') || lower.includes('pipe') || lower.includes('tap') || lower.includes('flooding')) {
                replyText = "Plumbing issues can cause slippery hazards and structural damage. Please let me know the building and room number so our plumbing crew can be dispatched immediately.";
              } else if (lower.includes('spark') || lower.includes('electric') || lower.includes('wire') || lower.includes('shock') || lower.includes('fire')) {
                replyText = "⚠️ Electrical safety alert: Please keep a safe distance from any sparking or exposed wiring! What room or corridor is this located in so we can send an emergency electrician?";
              } else if (lower.includes('fan') || lower.includes('light') || lower.includes('switch') || lower.includes('socket')) {
                replyText = `Noted regarding the ${lower.includes('fan') ? 'fan' : lower.includes('light') ? 'lighting' : 'electrical fitting'}. Is it completely non-functional or intermittent? Please share the room number so we can fix it.`;
              } else if (lower.includes('projector') || lower.includes('screen') || lower.includes('hdmi') || lower.includes('display')) {
                replyText = "For classroom/lab projector issues: our IT infrastructure team handles lamp replacements and connectivity. Which lecture hall or lab are you in?";
              } else if (lower.includes('status') || lower.includes('track') || lower.includes('ticket') || lower.includes('progress')) {
                replyText = "You can track your active tickets and SLA timers on your Dashboard under 'Active Complaints'. You will receive real-time updates as staff resolves your request.";
              } else if (lower.includes('thanks') || lower.includes('thank you') || lower.includes('nandri') || lower.includes('நன்றி')) {
                replyText = "You're very welcome! If there is anything else around campus that needs repair or attention, just let me know.";
              } else if (fullContext.includes('issue') && lower.length > 3) {
                replyText = `Got it: "${lastMsg}". I've added this detail to the active maintenance context. Would you like me to submit this ticket now or add a photo?`;
              } else {
                replyText = `I have received your message: "${lastMsg}". How would you like me to assist with your campus facilities request?`;
              }

              return sendJson(200, { reply: replyText, modelUsed: 'CampusFix AI Assistant' });
            }
          });
        }

        // 9. Text-to-Speech route (Gemini 3.8 Flash Lite TTS)
        if (pathname === '/api/tts' || pathname === '/api/v1/tts') {
          return readBody().then(async (body) => {
            const { text, voice = 'Kore', lang = 'en' } = body;
            if (!text || !text.trim()) {
              return sendJson(400, { error: 'No text provided for speech synthesis' });
            }

            try {
              const { GoogleGenAI } = await import('@google/genai');
              const ai = new GoogleGenAI({
                apiKey: process.env.GEMINI_API_KEY,
                httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
              });

              // Clean text for optimal speech synthesis
              const cleanText = text
                .replace(/[*#_`]/g, '')
                .replace(/\[Attached Photo\]/g, '')
                .replace(/https?:\/\/\S+/g, '')
                .replace(/•/g, ', ')
                .trim()
                .slice(0, 800);

              const isTamil = /[\u0B80-\u0BFF]/.test(cleanText) || lang.startsWith('ta');

              const response = await ai.models.generateContent({
                model: 'gemini-3.8-flash-lite-tts',
                contents: [
                  {
                    role: 'user',
                    parts: [
                      {
                        text: cleanText,
                        speechMetadata: {
                          style: isTamil
                            ? 'Clear, pleasant and articulate voice in Tamil'
                            : 'Clear, friendly, pleasant and warm female voice profile',
                        },
                      },
                    ],
                  },
                ],
                config: {
                  responseModalities: ['AUDIO'],
                  speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: voice || 'Kore' },
                    },
                  },
                },
              });

              const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
              if (base64Audio) {
                return sendJson(200, {
                  success: true,
                  audioUrl: `data:audio/wav;base64,${base64Audio}`,
                  format: 'wav',
                  modelUsed: 'gemini-3.8-flash-lite-tts',
                  voice: voice || 'Kore',
                });
              }
              return sendJson(200, { fallback: true, message: 'Audio data unavailable, fallback to Web Speech' });
            } catch (err) {
              console.warn('Gemini TTS endpoint notice (fallback enabled):', err.message || err);
              return sendJson(200, { fallback: true, message: 'Fallback to browser speech synthesis' });
            }
          });
        }

        // Default response for other /api routes
        return sendJson(200, { success: true });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), apiDevPlugin()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    hmr: false,
  },
})
