import React from "react";
import Sample from "../components/Sample";

const HomePage: React.FC = () => {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6 bg-red-500">ホームページ</h1>
            <Sample />
        </div>
    );
};

export default HomePage;
