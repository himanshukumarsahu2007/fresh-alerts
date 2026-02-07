const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t border-border py-8">
      <div className="container mx-auto max-w-6xl px-4">
        <p className="text-center text-sm text-muted-foreground">
          © {currentYear} FreshTrack. Keep it fresh.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
