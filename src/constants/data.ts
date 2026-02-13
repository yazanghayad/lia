export type Student = {
  photo_url: string;
  name: string;
  email: string;
  school: string;
  program: string;
  practice_type: 'prao' | 'apl' | 'lia';
  status: 'seeking' | 'matched' | 'placed' | 'completed';
  id: number;
  created_at: string;
  updated_at: string;
};

// Keep Product as alias for backward compatibility
export type Product = Student;

export interface RecentMatch {
  id: number;
  studentName: string;
  companyName: string;
  status: string;
  image: string;
  initials: string;
}

// Keep SaleUser as alias for backward compatibility
export interface SaleUser {
  id: number;
  name: string;
  email: string;
  amount: string;
  image: string;
  initials: string;
}

export const recentMatchesData: RecentMatch[] = [
  {
    id: 1,
    studentName: 'Emma Andersson',
    companyName: 'TechStart AB',
    status: 'Accepterad',
    image: 'https://api.slingacademy.com/public/sample-users/1.png',
    initials: 'EA'
  },
  {
    id: 2,
    studentName: 'Oscar Johansson',
    companyName: 'Digital Solutions',
    status: 'Väntande',
    image: 'https://api.slingacademy.com/public/sample-users/2.png',
    initials: 'OJ'
  },
  {
    id: 3,
    studentName: 'Maja Lindqvist',
    companyName: 'Kreativ Byrå',
    status: 'Intresserad',
    image: 'https://api.slingacademy.com/public/sample-users/3.png',
    initials: 'ML'
  },
  {
    id: 4,
    studentName: 'Liam Svensson',
    companyName: 'Lokalbutiken AB',
    status: 'Placerad',
    image: 'https://api.slingacademy.com/public/sample-users/4.png',
    initials: 'LS'
  },
  {
    id: 5,
    studentName: 'Ella Bergström',
    companyName: 'Vården Klinik',
    status: 'Avslutad',
    image: 'https://api.slingacademy.com/public/sample-users/5.png',
    initials: 'EB'
  }
];

// Keep recentSalesData as alias for backward compatibility
export const recentSalesData: SaleUser[] = recentMatchesData.map((m) => ({
  id: m.id,
  name: m.studentName,
  email: `${m.studentName.toLowerCase().replace(' ', '.')}@skola.se`,
  amount: m.status,
  image: m.image,
  initials: m.initials
}));
