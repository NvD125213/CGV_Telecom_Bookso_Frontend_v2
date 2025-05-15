import React, { useState, useEffect } from "react";
import { getPublicNumber1900 } from "../../services/digital";

const DigitalChannel = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getPublicNumber1900();
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Public Number 1900</h2>
      {/* Log hiển thị để kiểm tra */}
    </div>
  );
};

export default DigitalChannel;
