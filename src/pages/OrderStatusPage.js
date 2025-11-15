import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const OrderStatusPage = () => {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderStatus = async () => {
      try {
        const response = await axios.get(`/api/orders/status/${orderNumber}`);
        setOrder(response.data);
      } catch (err) {
        setError('Order not found or an error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderStatus();
  }, [orderNumber]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="container mt-5">
      <h2>Order Status</h2>
      <p>
        <strong>Order Number:</strong> {order.orderNumber}
      </p>
      <p>
        <strong>Status:</strong> {order.status}
      </p>
      <p>
        <strong>Order Date:</strong> {new Date(order.createdAt).toLocaleDateString()}
      </p>
    </div>
  );
};

export default OrderStatusPage;
