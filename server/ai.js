// AI-based keyword categorization module
const categoryKeywords = {
  Academic: ['marks', 'exam', 'professor', 'syllabus', 'class', 'lecture', 'grade', 'assignment', 'teacher', 'faculty', 'attendance', 'course', 'semester', 'result', 'paper', 'viva', 'practical', 'lab work', 'curriculum', 'timetable'],
  Hostel: ['hostel', 'food', 'mess', 'room', 'warden', 'roommate', 'laundry', 'water', 'curfew', 'canteen', 'dormitory', 'bed', 'cleanliness', 'hygiene'],
  Infrastructure: ['chair', 'lab', 'building', 'wifi', 'electricity', 'broken', 'repair', 'maintenance', 'projector', 'ac', 'air conditioner', 'fan', 'toilet', 'bathroom', 'parking', 'library', 'computer', 'desk', 'window', 'door'],
  Discipline: ['ragging', 'bully', 'fight', 'punishment', 'harassment', 'misconduct', 'cheating', 'violence', 'threat', 'abuse', 'discrimination'],
  Administration: ['fee', 'admission', 'certificate', 'office', 'scholarship', 'id card', 'document', 'registration', 'form', 'refund', 'transfer', 'verification', 'receipt'],
};

function categorizeComplaint(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  const scores = {};

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    scores[category] = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        scores[category]++;
      }
    }
  }

  let bestCategory = 'Others';
  let bestScore = 0;

  for (const [category, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestCategory;
}

module.exports = { categorizeComplaint };
