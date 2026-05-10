export interface TimeSlot {
  name: 'morning' | 'afternoon' | 'evening';
  startHour: number;
  endHour: number;
  greeting: string;
  icon: string;
}

export const timeSlots: TimeSlot[] = [
  {
    name: 'morning',
    startHour: 5,
    endHour: 11,
    greeting: 'おはようございます',
    icon: '🌅',
  },
  {
    name: 'afternoon',
    startHour: 11,
    endHour: 18,
    greeting: 'こんにちは',
    icon: '☀️',
  },
  {
    name: 'evening',
    startHour: 18,
    endHour: 5, // Wraps around midnight
    greeting: 'こんばんは',
    icon: '🌙',
  },
];

export const messages: Record<'morning' | 'afternoon' | 'evening', string[]> = {
  morning: [
    '今日も一日頑張りましょう！',
    '新しい朝、新しいコードが待っています。',
    '朝日を浴びて、コーディングをはじめましょう。',
    'おはよう！もうコーヒーは飲みましたか？',
    '今日のバグ修正は何個になるでしょうか？',
  ],
  afternoon: [
    '進捗はどうですか？コーヒーを淹れて一息つきましょう。',
    '午後も集中力を保ってコーディング頑張ってください！',
    'スタンドアップミーティングは終わりました？',
    'この時間が一日で最も生産性が高いですね。',
    'あと今日中に一つ機能を完成させちゃいましょう。',
  ],
  evening: [
    '今日もお疲れ様です。暗い画面の見すぎに注意してくださいね。',
    'もう少しだけ頑張るか、明日に任せるか...お任せします。',
    '夜のコーディングは最高のハッカータイムです。',
    'tonight\'s commit は何個になりましたか？',
    '夜中のコード変更は危険です。寝る前に確認しましょう。',
  ],
};

export function getTimeSlot(hour: number): TimeSlot {
  const slot = timeSlots.find((s) => {
    if (s.name === 'evening') {
      // Evening wraps around midnight
      return hour >= s.startHour || hour < s.endHour;
    }
    return hour >= s.startHour && hour < s.endHour;
  });
  return slot || timeSlots[1]; // Default to afternoon
}

export function getRandomMessage(hour: number): string {
  const slot = getTimeSlot(hour);
  const messageList = messages[slot.name];
  return messageList[Math.floor(Math.random() * messageList.length)];
}

export function getGreeting(hour: number): string {
  return getTimeSlot(hour).greeting;
}

export function getIcon(hour: number): string {
  return getTimeSlot(hour).icon;
}

export function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
