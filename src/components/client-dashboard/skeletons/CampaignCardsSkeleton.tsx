import { Card, CardHeader, CardContent } from '../../ui/Card';

export function CampaignCardsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden border-gray-100 rounded-2xl">
                    <CardHeader className="flex flex-row items-center justify-between p-5 pb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                            <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                            <div className="w-12 h-4 bg-gray-200 rounded-full animate-pulse ml-1"></div>
                        </div>
                        <div className="w-5 h-5 bg-gray-200 rounded-full animate-pulse"></div>
                    </CardHeader>

                    <CardContent className="p-5 pt-0 flex flex-col items-center">
                        <div className="w-full text-left mb-6">
                            <div className="w-3/4 h-5 bg-gray-200 rounded animate-pulse"></div>
                        </div>

                        <div className="relative w-48 h-[280px] bg-gray-100 rounded-[32px] p-2 shrink-0 animate-pulse border-8 border-gray-200">
                            <div className="w-full h-full bg-gray-200/50 rounded-[24px]"></div>
                        </div>

                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
