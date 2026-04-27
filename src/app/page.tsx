import MainApp from "@/components/MainApp";

export default function Home() {
  return (
    <main>
      <div style={{ background: '#ff0000', color: 'white', padding: '20px', textAlign: 'center', fontWeight: 'bold', fontSize: '32px', border: '5px solid yellow' }}>
        LEAD_FINDER_OK (PORT 3001)
      </div>
      <MainApp />
    </main>
  );
}
