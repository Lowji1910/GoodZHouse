export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-5 pt-4 border-top bg-light">
      <div className="container">
        <div className="row gy-3">
          <div className="col-md-4">
            <h5>GoodzHouse</h5>
            <p className="text-muted">Nội thất hiện đại cho mọi không gian.</p>
          </div>
          <div className="col-md-4">
            <h6>Liên hệ</h6>
            <ul className="list-unstyled text-muted mb-0">
              <li>Email: support@goodzhouse.local</li>
              <li>ĐT: 0123 456 789</li>
              <li>Địa chỉ: TP. HCM</li>
            </ul>
          </div>
          <div className="col-md-4">
            <div className="ms-md-auto" style={{ width: 200 }}>
              <div className="ratio ratio-1x1 rounded overflow-hidden">
                <iframe
                  title="GoodzHouse Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3582.3455592441146!2d106.65184127461322!3d10.800021089350205!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3175292976c117ad%3A0x5b3f38b21051f84!2zSOG7jWMgVmnhu4duIEjDoG5nIEtow7RuZyBWaeG7h3QgTmFtIENTMg!5e1!3m2!1svi!2s!4v1762587626951!5m2!1svi!2s"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
            <div className="text-md-end mt-2">
              <small className="text-muted">© {year} GoodzHouse</small>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

