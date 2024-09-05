import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import Sample from "~/components/Sample";

export const meta: MetaFunction = () => {
    return [
        { title: "New Remix App" },
        { name: "description", content: "Welcome to Remix!" },
    ];
};

export default function Index() {
    return (
        <div className="font-sans p-4">
            <h1 className="text-3xl font-bold mb-6">ホームページ</h1>
            <nav className="mb-4">
                <Link to="/about" className="text-blue-500 hover:underline">
                    会社概要
                </Link>
            </nav>
            <Sample />
            {/* 既存のコンテンツはここに残すこともできます */}
        </div>
    );
}
