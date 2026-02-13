import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardAction
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaGraph } from './area-graph';
import { BarGraph } from './bar-graph';
import { PieGraph } from './pie-graph';
import { RecentSales } from './recent-sales';
import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';

export default function OverViewPage() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-2'>
        <div className='flex items-center justify-between space-y-2'>
          <h2 className='text-2xl font-bold tracking-tight'>
            Välkommen till PraktikFinder 👋
          </h2>
          <div className='hidden items-center space-x-2 md:flex'>
            <Button>Exportera</Button>
          </div>
        </div>
        <Tabs defaultValue='overview' className='space-y-4'>
          <TabsList>
            <TabsTrigger value='overview'>Översikt</TabsTrigger>
            <TabsTrigger value='analytics' disabled>
              Statistik
            </TabsTrigger>
          </TabsList>
          <TabsContent value='overview' className='space-y-4'>
            <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4'>
              <Card className='@container/card'>
                <CardHeader>
                  <CardDescription>Totalt studenter</CardDescription>
                  <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                    247
                  </CardTitle>
                  <CardAction>
                    <Badge variant='outline'>
                      <IconTrendingUp />
                      +18%
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                  <div className='line-clamp-1 flex gap-2 font-medium'>
                    Ökar denna månad <IconTrendingUp className='size-4' />
                  </div>
                  <div className='text-muted-foreground'>
                    Studenter som söker praktik
                  </div>
                </CardFooter>
              </Card>
              <Card className='@container/card'>
                <CardHeader>
                  <CardDescription>Registrerade företag</CardDescription>
                  <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                    89
                  </CardTitle>
                  <CardAction>
                    <Badge variant='outline'>
                      <IconTrendingUp />
                      +8%
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                  <div className='line-clamp-1 flex gap-2 font-medium'>
                    Nya företag denna vecka{' '}
                    <IconTrendingUp className='size-4' />
                  </div>
                  <div className='text-muted-foreground'>
                    Företag med lediga platser
                  </div>
                </CardFooter>
              </Card>
              <Card className='@container/card'>
                <CardHeader>
                  <CardDescription>Aktiva matchningar</CardDescription>
                  <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                    156
                  </CardTitle>
                  <CardAction>
                    <Badge variant='outline'>
                      <IconTrendingUp />
                      +23%
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                  <div className='line-clamp-1 flex gap-2 font-medium'>
                    Hög matchningsgrad <IconTrendingUp className='size-4' />
                  </div>
                  <div className='text-muted-foreground'>
                    Pågående praktikplaceringar
                  </div>
                </CardFooter>
              </Card>
              <Card className='@container/card'>
                <CardHeader>
                  <CardDescription>Anslutna skolor</CardDescription>
                  <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                    12
                  </CardTitle>
                  <CardAction>
                    <Badge variant='outline'>
                      <IconTrendingUp />
                      +2
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                  <div className='line-clamp-1 flex gap-2 font-medium'>
                    Nya skolor anslutna <IconTrendingUp className='size-4' />
                  </div>
                  <div className='text-muted-foreground'>
                    Gymnasie- och YH-skolor
                  </div>
                </CardFooter>
              </Card>
            </div>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
              <div className='col-span-4'>
                <BarGraph />
              </div>
              <Card className='col-span-4 md:col-span-3'>
                <RecentSales />
              </Card>
              <div className='col-span-4'>
                <AreaGraph />
              </div>
              <div className='col-span-4 md:col-span-3'>
                <PieGraph />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
