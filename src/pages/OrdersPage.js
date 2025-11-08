import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/orders${user?.id ? `?userId=${user.id}` : ''}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          setOrders(data);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user?.id]);

  if (loading) return <div className="container py-4">Đang tải...</div>;

  return (
    <div className="container py-4">
      <h2 className="mb-4">Đơn hàng của tôi</h2>

      {orders.length === 0 ? (
        <div className="text-center text-muted">
          <p>Bạn chưa có đơn hàng nào</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Ngày đặt</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                    <td>{order.total?.toLocaleString('vi-VN')}₫</td>
                    <td>
                      <span className={`badge bg-${
                        order.status === 'completed' ? 'success' :
                        order.status === 'cancelled' ? 'danger' :
                        'warning'
                      }`}>
                        {order.status === 'completed' ? 'Hoàn thành' :
                         order.status === 'cancelled' ? 'Đã hủy' :
                         order.status === 'shipping' ? 'Đang giao' :
                         'Đang xử lý'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}