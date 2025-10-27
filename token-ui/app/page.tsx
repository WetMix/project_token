"use client"
import React, { useEffect, useState } from "react";
import Web3 from "web3";
import { AbiItem } from "web3-utils";
import TokenABI from "../contracts/Token.json"; // ABI твоего контракта

const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_CHAIN_HEX = "0xaa36a7";
const TOKEN_ADDRESS = "0x8c87568cA9256B8B05bDb7C03d91E3d777d73C78";

declare global {
  interface Window {
    ethereum?: any;
  }
}

const TokenInterface: React.FC = () => {
  const [isClient, setIsClient] = useState(false);
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [userAddress, setUserAddress] = useState<string>("");
  const [contract, setContract] = useState<any>(null);
  const [balance, setBalance] = useState<string>("0");
  const [decimals, setDecimals] = useState<number>(18);
  const [isOwner, setIsOwner] = useState<boolean>(false);

  const [transferTo, setTransferTo] = useState<string>("");
  const [transferAmount, setTransferAmount] = useState<string>("");

  const [mintTo, setMintTo] = useState<string>("");
  const [mintAmount, setMintAmount] = useState<string>("");

  // Инициализация web3 и контракта
  useEffect(() => {
    if (window.ethereum) {
      const w3 = new Web3(window.ethereum);
      setWeb3(w3);

      const tokenContract = new w3.eth.Contract(
        TokenABI.abi as AbiItem[],
        TOKEN_ADDRESS
      );
      setContract(tokenContract);

      // Получаем текущий аккаунт
      window.ethereum.request({ method: "eth_requestAccounts" }).then((accounts: string[]) => {
        setUserAddress(accounts[0]);
      });
    } else {
      alert("Установите MetaMask!");
    }
  }, []);

  // Получение баланса и информации о владельце
  useEffect(() => {
    if (!contract || !userAddress) return;

    const fetchBalance = async () => {
      const dec = await contract.methods.decimals().call();
      setDecimals(Number(dec));

      const rawBalance = await contract.methods.balanceOf(userAddress).call();
      setBalance(Web3.utils.fromWei(rawBalance, "ether")); // если decimals = 18
    };

    const fetchOwner = async () => {
      const owner = await contract.methods.owner().call();
      setIsOwner(owner.toLowerCase() === userAddress.toLowerCase());
    };

    fetchBalance();
    fetchOwner();
  }, [contract, userAddress]);

  // =======================
  // Функция отправки токена
  // =======================
  const handleTransfer = async () => {
    if (!contract || !userAddress) return;
    if (!transferTo || !transferAmount) {
      alert("Введите адрес и сумму перевода!");
      return;
    }

    const amount = Web3.utils.toWei(transferAmount, "ether"); // если decimals = 18
    try {
      await contract.methods.transfer(transferTo, amount).send({ from: userAddress });
      alert("Транзакция отправлена!");
    } catch (err) {
      console.error(err);
      alert("Ошибка при переводе!");
    }
  };

  // =======================
  // Функция чеканки токена (только для владельца)
  // =======================
  const handleMint = async () => {
    if (!contract || !userAddress) return;
    if (!mintTo || !mintAmount) {
      alert("Введите адрес и количество для чеканки!");
      return;
    }

    const amount = Web3.utils.toWei(mintAmount, "ether"); // если decimals = 18
    try {
      await contract.methods.mint(mintTo, amount).send({ from: userAddress });
      alert("Токены успешно созданы!");
    } catch (err) {
      console.error(err);
      alert("Ошибка при чеканке!");
    }
  };

  // =======================
  // Добавление токена в MetaMask (EIP-747)
  // =======================
   useEffect(() => {
    setIsClient(true);
  }, []);
  const addTokenToMetaMask = async () => {
  try {
    const tokenAddress = TOKEN_ADDRESS;
    const symbol = await contract.methods.symbol().call();
    console.log(symbol); // адрес токена
    const tokenSymbol = "HELL0";        // символ токена
    const tokenDecimals = 18;           // decimals из контракта
    const tokenImage = "https://example.com/token.png"; // необязательно

      if (typeof window === "undefined" || !window.ethereum) {
    alert("MetaMask не найден");
    return;
  }
  const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (!accounts.length) {
        await window.ethereum.request({ method: "eth_requestAccounts" });
      }
  
    const wasAdded = await window.ethereum.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: {
          address: tokenAddress,
          symbol: tokenSymbol,
          decimals: tokenDecimals,
          image: tokenImage,
        },
      },
    });

   if (wasAdded) {
        alert("Токен добавлен в MetaMask!");
      } else {
        alert("Пользователь отклонил добавление токена.");
      }
    } catch (err: any) {
      console.error("Ошибка при добавлении токена:", err);

      // MetaMask действительно не поддерживает метод (редко, в старых версиях)
      if (err?.code === -32601) {
        alert("Ваш MetaMask не поддерживает EIP-747 (wallet_watchAsset).");
      } else if (err?.message?.includes("Invalid parameters")) {
        alert("MetaMask получил неправильные параметры. Проверь токен-данные.");
      } else {
        alert("Не удалось добавить токен. Подробности в консоли.");
      }
  }
};


  return (
    <div style={{ padding: "20px" }}>
      <h2>Адрес пользователя: {userAddress}</h2>
      <p>Баланс: {balance} токенов</p>

      <hr />

      <h3>Отправка токенов</h3>
      <input
        type="text"
        placeholder="Кому"
        value={transferTo}
        onChange={(e) => setTransferTo(e.target.value)}
      />
      <input
        type="text"
        placeholder="Сумма"
        value={transferAmount}
        onChange={(e) => setTransferAmount(e.target.value)}
      />
      <button onClick={handleTransfer}>Отправить</button>

      {isOwner && (
        <>
          <hr />
          <h3>Чеканка токенов (только владелец)</h3>
          <input
            type="text"
            placeholder="Кому"
            value={mintTo}
            onChange={(e) => setMintTo(e.target.value)}
          />
          <input
            type="text"
            placeholder="Сумма"
            value={mintAmount}
            onChange={(e) => setMintAmount(e.target.value)}
          />
          <button onClick={handleMint}>Чеканка</button>
        </>
      )}

      <hr />
      {isClient && window.ethereum && (
        <button onClick={addTokenToMetaMask}>Добавить токен в MetaMask</button>
      )}
    </div>
  );
};

export default TokenInterface;

