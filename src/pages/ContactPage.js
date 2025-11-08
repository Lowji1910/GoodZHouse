export default function ContactPage() {
  return (
    <div className="container py-4">
      <h2 className="mb-3">Liên hệ</h2>
      <div className="row g-4">
        <div className="col-md-5">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <h5>GoodzHouse</h5>
              <p className="text-muted mb-1">Email: support@goodzhouse.local</p>
              <p className="text-muted mb-1">ĐT: 0123 456 789</p>
              <p className="text-muted">Địa chỉ: TP. HCM</p>
            </div>
          </div>
        </div>
        <div className="col-md-7">
          <div className="ratio ratio-16x9 rounded overflow-hidden shadow-sm">
            <iframe
              title="GoodzHouse Map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3582.3455592441146!2d106.65184127461322!3d10.800021089350205!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3175292976c117ad%3A0x5b3f38b21051f84!2zSOG7jWMgVmnhu4duIEjDoG5nIEtow7RuZyBWaeG7h3QgTmFtIENTMg!5e1!3m2!1svi!2s!4v1762587626951!5m2!1svi!2s"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

