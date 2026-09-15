import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, setDoc, getDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { db } from './firebase';

export default function TerminuxOrtakDepo() {
    const [products, setProducts] = useState([]);
    const [racks] = useState(['RAF-A1', 'RAF-A2', 'RAF-B1', 'RAF-B2', 'AMELIYATHANE-R1', 'AMELIYATHANE-R2']);
    
    const [selectedRack, setSelectedRack] = useState('');
    const [selectedProduct, setSelectedProduct] = useState('');
    const [miatDate, setMiatDate] = useState('');
    const [quantity, setQuantity] = useState('');
    
    const [adminPassword, setAdminPassword] = useState('');
    const [isAdminValid, setIsAdminValid] = useState(false);
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [auditLogs, setAuditLogs] = useState([]);
    
    const [activeQR, setActiveQR] = useState(null);
    const [currentUser] = useState('Personel_01'); 

    useEffect(() => {
        const fetchProducts = async () => {
            const querySnapshot = await getDocs(collection(db, 'products'));
            const productList = querySnapshot.docs.map(d => ({ 
                id: d.id, 
                asgCode: d.data().asgCode, 
                name: d.data().name 
            }));
            setProducts(productList);
        };
        fetchProducts();
    }, []);

    const handleTransaction = async (type) => {
        if (!selectedRack || !selectedProduct || !miatDate || !quantity) return;

        const qty = parseInt(quantity, 10);
        const productRef = doc(db, 'terminux_rack_stocks', `${selectedRack}_${selectedProduct}_${miatDate}`);
        const productSnap = await getDoc(productRef);

        let currentStock = 0;
        if (productSnap.exists()) {
            currentStock = productSnap.data().stock;
        }

        const newStock = type === 'add' ? currentStock + qty : currentStock - qty;

        if (newStock < 0) return;

        await setDoc(productRef, {
            rackId: selectedRack,
            productId: selectedProduct,
            miat: miatDate,
            stock: newStock,
            lastUpdated: serverTimestamp()
        }, { merge: true });

        await addDoc(collection(db, 'terminux_audit_logs'), {
            rackId: selectedRack,
            productId: selectedProduct,
            action: type,
            quantity: qty,
            miat: miatDate,
            user: currentUser,
            timestamp: serverTimestamp()
        });

        setQuantity('');
    };

    const handleAdminLogin = async () => {
        if (adminPassword === 'TerminuxAdmin2026') {
            setIsAdminValid(true);
            const q = query(collection(db, 'terminux_audit_logs'), orderBy('timestamp', 'desc'));
            const querySnapshot = await getDocs(q);
            const logs = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setAuditLogs(logs);
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate();
        return date.toLocaleString('tr-TR');
    };

    return (
        <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Terminux Ortak Depo Yönetimi</h1>
                <button 
                    onClick={() => setShowAdminPanel(!showAdminPanel)} 
                    className="w-8 h-8 rounded-full bg-gray-200 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-default"
                >
                    <span className="text-xs text-gray-400">#</span>
                </button>
            </div>

            {showAdminPanel && !isAdminValid && (
                <div className="mb-6 p-4 bg-white rounded shadow flex gap-4">
                    <input 
                        type="password" 
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="border p-2 rounded w-64 outline-none"
                    />
                    <button onClick={handleAdminLogin} className="bg-red-600 text-white px-4 py-2 rounded">
                        Giriş
                    </button>
                </div>
            )}

            {isAdminValid && (
                <div className="mb-6 p-4 bg-white rounded shadow">
                    <h2 className="text-xl font-bold mb-4 text-red-600">Gizli İşlem Kayıtları</h2>
                    <div className="max-h-64 overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b bg-gray-100">
                                    <th className="p-2">Tarih</th>
                                    <th className="p-2">Kullanıcı</th>
                                    <th className="p-2">İşlem</th>
                                    <th className="p-2">Raf</th>
                                    <th className="p-2">Ürün ID</th>
                                    <th className="p-2">Miat</th>
                                    <th className="p-2">Miktar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {auditLogs.map(log => (
                                    <tr key={log.id} className="border-b text-sm">
                                        <td className="p-2">{formatDate(log.timestamp)}</td>
                                        <td className="p-2">{log.user}</td>
                                        <td className="p-2">
                                            <span className={`px-2 py-1 rounded text-white text-xs ${log.action === 'add' ? 'bg-green-500' : 'bg-red-500'}`}>
                                                {log.action === 'add' ? 'EKLENDİ' : 'ÇIKARILDI'}
                                            </span>
                                        </td>
                                        <td className="p-2">{log.rackId}</td>
                                        <td className="p-2">{log.productId}</td>
                                        <td className="p-2 font-mono">{log.miat}</td>
                                        <td className="p-2 font-bold">{log.quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded shadow border-t-4 border-blue-600">
                    <h2 className="text-xl font-bold mb-6 text-gray-800">Manuel Stok İşlemi</h2>
                    
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1 text-gray-600">Raf Adresi</label>
                        <select 
                            className="w-full border p-2 rounded outline-none focus:border-blue-500"
                            value={selectedRack}
                            onChange={(e) => setSelectedRack(e.target.value)}
                        >
                            <option value="">Raf Seçiniz</option>
                            {racks.map(rack => (
                                <option key={rack} value={rack}>{rack}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1 text-gray-600">Ürün (ASG - İsim)</label>
                        <select 
                            className="w-full border p-2 rounded outline-none focus:border-blue-500"
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value)}
                        >
                            <option value="">Ürün Seçiniz</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.asgCode} - {p.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-4 mb-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-1 text-gray-600">Miat Tarihi</label>
                            <input 
                                type="date" 
                                className="w-full border p-2 rounded outline-none focus:border-blue-500"
                                value={miatDate}
                                onChange={(e) => setMiatDate(e.target.value)}
                            />
                        </div>

                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-1 text-gray-600">Miktar</label>
                            <input 
                                type="number" 
                                min="1"
                                className="w-full border p-2 rounded outline-none focus:border-blue-500"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 mt-8">
                        <button 
                            onClick={() => handleTransaction('add')}
                            className="flex-1 bg-green-600 text-white py-3 rounded font-bold hover:bg-green-700 transition-colors"
                        >
                            Stok Ekle
                        </button>
                        <button 
                            onClick={() => handleTransaction('remove')}
                            className="flex-1 bg-red-600 text-white py-3 rounded font-bold hover:bg-red-700 transition-colors"
                        >
                            Stok Çıkar
                        </button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded shadow border-t-4 border-gray-800">
                    <h2 className="text-xl font-bold mb-6 text-gray-800">QR Kod Adresleri</h2>
                    
                    <button 
                        onClick={() => setActiveQR('MASTER_QR_ALL_RACKS')}
                        className="w-full bg-gray-800 text-white py-3 rounded font-bold mb-6 hover:bg-gray-900 transition-colors"
                    >
                        Tüm Adresleri Gösteren Ana QR Kodu Üret
                    </button>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {racks.map(rack => (
                            <button 
                                key={rack}
                                onClick={() => setActiveQR(rack)}
                                className="border border-gray-300 p-2 rounded text-center hover:bg-gray-100 font-medium text-gray-700"
                            >
                                {rack}
                            </button>
                        ))}
                    </div>

                    {activeQR && (
                        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded bg-gray-50">
                            <QRCodeSVG value={activeQR} size={220} />
                            <p className="mt-6 font-bold text-xl text-gray-800 tracking-wider">
                                {activeQR === 'MASTER_QR_ALL_RACKS' ? 'ANA DEPO QR' : activeQR}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
