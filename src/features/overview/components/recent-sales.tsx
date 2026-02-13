import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const matchesData = [
  {
    studentName: 'Emma Andersson',
    companyName: 'TechStart AB',
    avatar: 'https://api.slingacademy.com/public/sample-users/1.png',
    fallback: 'EA',
    status: 'Accepterad',
    variant: 'default' as const
  },
  {
    studentName: 'Oscar Johansson',
    companyName: 'Digital Solutions',
    avatar: 'https://api.slingacademy.com/public/sample-users/2.png',
    fallback: 'OJ',
    status: 'Väntande',
    variant: 'secondary' as const
  },
  {
    studentName: 'Maja Lindqvist',
    companyName: 'Kreativ Byrå',
    avatar: 'https://api.slingacademy.com/public/sample-users/3.png',
    fallback: 'ML',
    status: 'Intresserad',
    variant: 'outline' as const
  },
  {
    studentName: 'Liam Svensson',
    companyName: 'Lokalbutiken AB',
    avatar: 'https://api.slingacademy.com/public/sample-users/4.png',
    fallback: 'LS',
    status: 'Placerad',
    variant: 'default' as const
  },
  {
    studentName: 'Ella Bergström',
    companyName: 'Vården Klinik',
    avatar: 'https://api.slingacademy.com/public/sample-users/5.png',
    fallback: 'EB',
    status: 'Avslutad',
    variant: 'secondary' as const
  }
];

export function RecentSales() {
  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>Senaste matchningar</CardTitle>
        <CardDescription>32 nya matchningar denna månad.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-8'>
          {matchesData.map((match, index) => (
            <div key={index} className='flex items-center'>
              <Avatar className='h-9 w-9'>
                <AvatarImage src={match.avatar} alt='Avatar' />
                <AvatarFallback>{match.fallback}</AvatarFallback>
              </Avatar>
              <div className='ml-4 space-y-1'>
                <p className='text-sm leading-none font-medium'>
                  {match.studentName}
                </p>
                <p className='text-muted-foreground text-sm'>
                  {match.companyName}
                </p>
              </div>
              <div className='ml-auto'>
                <Badge variant={match.variant}>{match.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
