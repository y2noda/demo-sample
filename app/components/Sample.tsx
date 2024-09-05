import React from "react";
import { Button } from "~/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card";

const Sample: React.FC = () => {
    return (
        <Card className="w-[350px]">
            <CardHeader>
                <CardTitle>これはサンプルコンポーネントです</CardTitle>
                <CardDescription>
                    shadcn UIを使用して作成されました
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="mb-4">
                    ここに必要なコンテンツを追加してください。
                </p>
                <Button>アクション</Button>
            </CardContent>
        </Card>
    );
};

export default Sample;
