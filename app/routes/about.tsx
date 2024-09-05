import { useEffect, useState } from "react";
import Table from "~/components/Table";

export default function About() {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return <div>{isClient ? <Table /> : <div>Loading...</div>}</div>;
}
