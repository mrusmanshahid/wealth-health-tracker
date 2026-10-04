"""Country / broker availability for projector holdings (guidance only)."""

from __future__ import annotations

from typing import Any

# Brokers are illustrative — availability changes; verify with the broker.
COUNTRIES: dict[str, dict[str, Any]] = {
    "US": {
        "code": "US",
        "name": "United States",
        "currency": "USD",
        "flag": "🇺🇸",
        "brokers": [
            {"id": "fidelity", "name": "Fidelity", "type": "full-service"},
            {"id": "schwab", "name": "Charles Schwab", "type": "full-service"},
            {"id": "vanguard", "name": "Vanguard", "type": "broker / fund house"},
            {"id": "ibkr", "name": "Interactive Brokers", "type": "international"},
            {"id": "robinhood", "name": "Robinhood", "type": "app broker"},
        ],
        "savingsNote": "High-yield savings via banks / broker cash sweep (e.g. Fidelity CMA, Ally).",
        "notes": "All US-listed stocks and ETFs in this planner are typically available.",
    },
    "UK": {
        "code": "UK",
        "name": "United Kingdom",
        "currency": "GBP",
        "flag": "🇬🇧",
        "brokers": [
            {"id": "hl", "name": "Hargreaves Lansdown", "type": "platform"},
            {"id": "trading212", "name": "Trading 212", "type": "app broker"},
            {"id": "ibkr", "name": "Interactive Brokers", "type": "international"},
            {"id": "freetrade", "name": "Freetrade", "type": "app broker"},
        ],
        "savingsNote": "Cash / easy-access savings via UK banks or premium bonds; ISA cash accounts.",
        "notes": "Some US ETFs need a W-8BEN. Prefer UCITS ETFs when a US ETF is restricted.",
    },
    "DE": {
        "code": "DE",
        "name": "Germany / EU",
        "currency": "EUR",
        "flag": "🇪🇺",
        "brokers": [
            {"id": "tr", "name": "Trade Republic", "type": "app broker"},
            {"id": "scalable", "name": "Scalable Capital", "type": "app broker"},
            {"id": "ibkr", "name": "Interactive Brokers", "type": "international"},
            {"id": "consors", "name": "Consorsbank", "type": "bank broker"},
        ],
        "savingsNote": "Tagesgeld / overnight deposits at EU banks; Trade Republic cash interest where offered.",
        "notes": "PRIIPs rules often block US-domiciled ETFs (VOO, QQQ, SCHD). Use UCITS alternatives.",
    },
    "PK": {
        "code": "PK",
        "name": "Pakistan",
        "currency": "PKR",
        "flag": "🇵🇰",
        "brokers": [
            {"id": "ibkr", "name": "Interactive Brokers", "type": "international"},
            {"id": "stake", "name": "Stake (via partners)", "type": "intl access"},
            {"id": "local_psx", "name": "Local PSX broker", "type": "domestic"},
        ],
        "savingsNote": "PKR savings / T-bills / money-market funds at local banks; USD savings if you hold FX abroad.",
        "notes": "US stocks usually via IBKR or similar with SBP/FX limits. Local ETFs differ from US tickers.",
    },
    "AE": {
        "code": "AE",
        "name": "United Arab Emirates",
        "currency": "AED",
        "flag": "🇦🇪",
        "brokers": [
            {"id": "ibkr", "name": "Interactive Brokers", "type": "international"},
            {"id": "sarwa", "name": "Sarwa", "type": "wealth app"},
            {"id": "tickmill", "name": "Tickmill / intl brokers", "type": "intl access"},
        ],
        "savingsNote": "AED / USD savings and sukuk / money-market products at UAE banks.",
        "notes": "Most US-listed names are reachable via IBKR or regional wealth apps.",
    },
    "CA": {
        "code": "CA",
        "name": "Canada",
        "currency": "CAD",
        "flag": "🇨🇦",
        "brokers": [
            {"id": "questrade", "name": "Questrade", "type": "discount"},
            {"id": "wealthsimple", "name": "Wealthsimple", "type": "app broker"},
            {"id": "ibkr", "name": "Interactive Brokers", "type": "international"},
            {"id": "td", "name": "TD Direct Investing", "type": "bank broker"},
        ],
        "savingsNote": "HISA / cash ETFs (e.g. PSA.TO) or bank high-interest savings.",
        "notes": "US tickers trade fine; CAD-hedged or TSX-listed alternatives exist for some ETFs.",
    },
    "AU": {
        "code": "AU",
        "name": "Australia",
        "currency": "AUD",
        "flag": "🇦🇺",
        "brokers": [
            {"id": "commsec", "name": "CommSec", "type": "bank broker"},
            {"id": "selfwealth", "name": "SelfWealth", "type": "discount"},
            {"id": "ibkr", "name": "Interactive Brokers", "type": "international"},
            {"id": "stake", "name": "Stake", "type": "US access"},
        ],
        "savingsNote": "High-interest savings accounts (HISAs) at AU banks.",
        "notes": "US shares via Stake/IBKR; ASX ETFs can substitute for some US index exposures.",
    },
    "IN": {
        "code": "IN",
        "name": "India",
        "currency": "INR",
        "flag": "🇮🇳",
        "brokers": [
            {"id": "ibkr", "name": "Interactive Brokers", "type": "international"},
            {"id": "vested", "name": "Vested", "type": "US access"},
            {"id": "indmoney", "name": "INDmoney", "type": "US access"},
        ],
        "savingsNote": "Bank FDs, liquid funds, or arbitrage funds for the cash sleeve.",
        "notes": "LRS rules apply for overseas investing. Prefer Vested/IBKR for US names.",
    },
    "SG": {
        "code": "SG",
        "name": "Singapore",
        "currency": "SGD",
        "flag": "🇸🇬",
        "brokers": [
            {"id": "ibkr", "name": "Interactive Brokers", "type": "international"},
            {"id": "fsmone", "name": "FSMOne", "type": "platform"},
            {"id": "tiger", "name": "Tiger Brokers", "type": "app broker"},
            {"id": "moomoo", "name": "moomoo SG", "type": "app broker"},
        ],
        "savingsNote": "SGD / USD fixed deposits or money-market funds at SG banks.",
        "notes": "US stocks and ETFs widely available; some prefer UCITS listed in London/SGX.",
    },
}

# Per-symbol availability overrides by country.
# available: True / False / "limited"
# brokers: subset of country broker ids that typically offer it
# alternative: { symbol, name, reason } when not available or preferred local substitute
SYMBOL_ACCESS: dict[str, dict[str, dict[str, Any]]] = {
    # Mega-cap US stocks — generally available wherever US equities are offered
    "AAPL": {
        "US": {"available": True, "brokers": ["fidelity", "schwab", "vanguard", "ibkr", "robinhood"]},
        "UK": {"available": True, "brokers": ["hl", "trading212", "ibkr", "freetrade"]},
        "DE": {"available": True, "brokers": ["tr", "scalable", "ibkr", "consors"]},
        "PK": {"available": True, "brokers": ["ibkr", "stake"]},
        "AE": {"available": True, "brokers": ["ibkr", "sarwa"]},
        "CA": {"available": True, "brokers": ["questrade", "wealthsimple", "ibkr", "td"]},
        "AU": {"available": True, "brokers": ["commsec", "ibkr", "stake"]},
        "IN": {"available": True, "brokers": ["ibkr", "vested", "indmoney"]},
        "SG": {"available": True, "brokers": ["ibkr", "tiger", "moomoo", "fsmone"]},
    },
    "MSFT": {
        "US": {"available": True, "brokers": ["fidelity", "schwab", "vanguard", "ibkr", "robinhood"]},
        "UK": {"available": True, "brokers": ["hl", "trading212", "ibkr", "freetrade"]},
        "DE": {"available": True, "brokers": ["tr", "scalable", "ibkr", "consors"]},
        "PK": {"available": True, "brokers": ["ibkr", "stake"]},
        "AE": {"available": True, "brokers": ["ibkr", "sarwa"]},
        "CA": {"available": True, "brokers": ["questrade", "wealthsimple", "ibkr", "td"]},
        "AU": {"available": True, "brokers": ["commsec", "ibkr", "stake"]},
        "IN": {"available": True, "brokers": ["ibkr", "vested", "indmoney"]},
        "SG": {"available": True, "brokers": ["ibkr", "tiger", "moomoo", "fsmone"]},
    },
    "NVDA": {
        "US": {"available": True, "brokers": ["fidelity", "schwab", "ibkr", "robinhood"]},
        "UK": {"available": True, "brokers": ["hl", "trading212", "ibkr"]},
        "DE": {"available": True, "brokers": ["tr", "scalable", "ibkr"]},
        "PK": {"available": True, "brokers": ["ibkr", "stake"]},
        "AE": {"available": True, "brokers": ["ibkr", "sarwa"]},
        "CA": {"available": True, "brokers": ["questrade", "wealthsimple", "ibkr"]},
        "AU": {"available": True, "brokers": ["ibkr", "stake"]},
        "IN": {"available": True, "brokers": ["ibkr", "vested", "indmoney"]},
        "SG": {"available": True, "brokers": ["ibkr", "tiger", "moomoo"]},
    },
    "GOOGL": {
        "US": {"available": True, "brokers": ["fidelity", "schwab", "ibkr", "robinhood"]},
        "UK": {"available": True, "brokers": ["hl", "trading212", "ibkr"]},
        "DE": {"available": True, "brokers": ["tr", "scalable", "ibkr"]},
        "PK": {"available": True, "brokers": ["ibkr", "stake"]},
        "AE": {"available": True, "brokers": ["ibkr", "sarwa"]},
        "CA": {"available": True, "brokers": ["questrade", "wealthsimple", "ibkr"]},
        "AU": {"available": True, "brokers": ["ibkr", "stake"]},
        "IN": {"available": True, "brokers": ["ibkr", "vested", "indmoney"]},
        "SG": {"available": True, "brokers": ["ibkr", "tiger", "moomoo"]},
    },
    "AMZN": {
        "US": {"available": True, "brokers": ["fidelity", "schwab", "ibkr", "robinhood"]},
        "UK": {"available": True, "brokers": ["hl", "trading212", "ibkr"]},
        "DE": {"available": True, "brokers": ["tr", "scalable", "ibkr"]},
        "PK": {"available": True, "brokers": ["ibkr", "stake"]},
        "AE": {"available": True, "brokers": ["ibkr", "sarwa"]},
        "CA": {"available": True, "brokers": ["questrade", "wealthsimple", "ibkr"]},
        "AU": {"available": True, "brokers": ["ibkr", "stake"]},
        "IN": {"available": True, "brokers": ["ibkr", "vested", "indmoney"]},
        "SG": {"available": True, "brokers": ["ibkr", "tiger", "moomoo"]},
    },
    "META": {
        "US": {"available": True, "brokers": ["fidelity", "schwab", "ibkr", "robinhood"]},
        "UK": {"available": True, "brokers": ["hl", "trading212", "ibkr"]},
        "DE": {"available": True, "brokers": ["tr", "scalable", "ibkr"]},
        "PK": {"available": True, "brokers": ["ibkr", "stake"]},
        "AE": {"available": True, "brokers": ["ibkr", "sarwa"]},
        "CA": {"available": True, "brokers": ["questrade", "wealthsimple", "ibkr"]},
        "AU": {"available": True, "brokers": ["ibkr", "stake"]},
        "IN": {"available": True, "brokers": ["ibkr", "vested", "indmoney"]},
        "SG": {"available": True, "brokers": ["ibkr", "tiger", "moomoo"]},
    },
    "TSLA": {
        "US": {"available": True, "brokers": ["fidelity", "schwab", "ibkr", "robinhood"]},
        "UK": {"available": True, "brokers": ["hl", "trading212", "ibkr"]},
        "DE": {"available": True, "brokers": ["tr", "scalable", "ibkr"]},
        "PK": {"available": True, "brokers": ["ibkr", "stake"]},
        "AE": {"available": True, "brokers": ["ibkr", "sarwa"]},
        "CA": {"available": True, "brokers": ["questrade", "wealthsimple", "ibkr"]},
        "AU": {"available": True, "brokers": ["ibkr", "stake"]},
        "IN": {"available": True, "brokers": ["ibkr", "vested", "indmoney"]},
        "SG": {"available": True, "brokers": ["ibkr", "tiger", "moomoo"]},
    },
    "JNJ": {
        "US": {"available": True, "brokers": ["fidelity", "schwab", "vanguard", "ibkr"]},
        "UK": {"available": True, "brokers": ["hl", "trading212", "ibkr"]},
        "DE": {"available": True, "brokers": ["tr", "scalable", "ibkr"]},
        "PK": {"available": True, "brokers": ["ibkr"]},
        "AE": {"available": True, "brokers": ["ibkr", "sarwa"]},
        "CA": {"available": True, "brokers": ["questrade", "ibkr", "td"]},
        "AU": {"available": True, "brokers": ["ibkr", "stake"]},
        "IN": {"available": True, "brokers": ["ibkr", "vested"]},
        "SG": {"available": True, "brokers": ["ibkr", "tiger", "moomoo"]},
    },
    "PG": {
        "US": {"available": True, "brokers": ["fidelity", "schwab", "vanguard", "ibkr"]},
        "UK": {"available": True, "brokers": ["hl", "trading212", "ibkr"]},
        "DE": {"available": True, "brokers": ["tr", "scalable", "ibkr"]},
        "PK": {"available": True, "brokers": ["ibkr"]},
        "AE": {"available": True, "brokers": ["ibkr", "sarwa"]},
        "CA": {"available": True, "brokers": ["questrade", "ibkr", "td"]},
        "AU": {"available": True, "brokers": ["ibkr", "stake"]},
        "IN": {"available": True, "brokers": ["ibkr", "vested"]},
        "SG": {"available": True, "brokers": ["ibkr", "tiger", "moomoo"]},
    },
    "JPM": {
        "US": {"available": True, "brokers": ["fidelity", "schwab", "ibkr", "robinhood"]},
        "UK": {"available": True, "brokers": ["hl", "trading212", "ibkr"]},
        "DE": {"available": True, "brokers": ["tr", "scalable", "ibkr"]},
        "PK": {"available": True, "brokers": ["ibkr"]},
        "AE": {"available": True, "brokers": ["ibkr", "sarwa"]},
        "CA": {"available": True, "brokers": ["questrade", "ibkr"]},
        "AU": {"available": True, "brokers": ["ibkr", "stake"]},
        "IN": {"available": True, "brokers": ["ibkr", "vested"]},
        "SG": {"available": True, "brokers": ["ibkr", "tiger", "moomoo"]},
    },
    # US ETFs — often blocked in EU (PRIIPs)
    "VOO": {
        "US": {"available": True, "brokers": ["fidelity", "schwab", "vanguard", "ibkr"]},
        "UK": {
            "available": "limited",
            "brokers": ["ibkr"],
            "alternative": {
                "symbol": "VUSA.L",
                "name": "Vanguard S&P 500 UCITS ETF",
                "reason": "UCITS S&P 500 equivalent easier for UK/EU retail platforms",
            },
        },
        "DE": {
            "available": False,
            "brokers": [],
            "alternative": {
                "symbol": "VUAA.DE",
                "name": "Vanguard S&P 500 UCITS (Acc)",
                "reason": "US-domiciled VOO usually blocked under PRIIPs — use UCITS",
            },
        },
        "PK": {"available": True, "brokers": ["ibkr"]},
        "AE": {"available": True, "brokers": ["ibkr", "sarwa"]},
        "CA": {
            "available": True,
            "brokers": ["questrade", "ibkr", "td"],
            "alternative": {
                "symbol": "VFV.TO",
                "name": "Vanguard S&P 500 Index ETF (CAD)",
                "reason": "CAD-listed S&P 500 option for RRSP/TFSA convenience",
            },
        },
        "AU": {
            "available": True,
            "brokers": ["ibkr", "stake"],
            "alternative": {
                "symbol": "IVV.AX",
                "name": "iShares S&P 500 ETF (ASX)",
                "reason": "ASX-listed S&P 500 alternative",
            },
        },
        "IN": {"available": True, "brokers": ["ibkr", "vested"]},
        "SG": {"available": True, "brokers": ["ibkr", "tiger", "moomoo"]},
    },
    "VTI": {
        "US": {"available": True, "brokers": ["fidelity", "schwab", "vanguard", "ibkr"]},
        "UK": {
            "available": "limited",
            "brokers": ["ibkr"],
            "alternative": {
                "symbol": "VWRL.L",
                "name": "Vanguard FTSE All-World UCITS",
                "reason": "Broad global UCITS substitute when VTI is awkward to buy",
            },
        },
        "DE": {
            "available": False,
            "brokers": [],
            "alternative": {
                "symbol": "VWCE.DE",
                "name": "Vanguard FTSE All-World UCITS (Acc)",
                "reason": "PRIIPs — use accumulating world UCITS instead of VTI",
            },
        },
        "PK": {"available": True, "brokers": ["ibkr"]},
        "AE": {"available": True, "brokers": ["ibkr"]},
        "CA": {
            "available": True,
            "brokers": ["questrade", "ibkr"],
            "alternative": {
                "symbol": "VUN.TO",
                "name": "Vanguard US Total Market (CAD)",
                "reason": "CAD-listed US total-market exposure",
            },
        },
        "AU": {"available": True, "brokers": ["ibkr", "stake"]},
        "IN": {"available": True, "brokers": ["ibkr", "vested"]},
        "SG": {"available": True, "brokers": ["ibkr", "tiger"]},
    },
    "QQQ": {
        "US": {"available": True, "brokers": ["fidelity", "schwab", "ibkr", "robinhood"]},
        "UK": {
            "available": "limited",
            "brokers": ["ibkr"],
            "alternative": {
                "symbol": "EQQQ.L",
                "name": "Invesco EQQQ Nasdaq-100 UCITS",
                "reason": "UCITS Nasdaq-100 for UK platforms",
            },
        },
        "DE": {
            "available": False,
            "brokers": [],
            "alternative": {
                "symbol": "EXXT.DE",
                "name": "iShares Nasdaq-100 UCITS",
                "reason": "US QQQ typically unavailable — Nasdaq-100 UCITS instead",
            },
        },
        "PK": {"available": True, "brokers": ["ibkr", "stake"]},
        "AE": {"available": True, "brokers": ["ibkr", "sarwa"]},
        "CA": {
            "available": True,
            "brokers": ["questrade", "ibkr"],
            "alternative": {
                "symbol": "XQQ.TO",
                "name": "iShares NASDAQ 100 Index ETF (CAD)",
                "reason": "TSX-listed Nasdaq-100 alternative",
            },
        },
        "AU": {
            "available": True,
            "brokers": ["ibkr", "stake"],
            "alternative": {
                "symbol": "NDQ.AX",
                "name": "BetaShares Nasdaq 100 ETF",
                "reason": "ASX-listed Nasdaq-100",
            },
        },
        "IN": {"available": True, "brokers": ["ibkr", "vested", "indmoney"]},
        "SG": {"available": True, "brokers": ["ibkr", "tiger", "moomoo"]},
    },
    "SCHD": {
        "US": {"available": True, "brokers": ["fidelity", "schwab", "ibkr"]},
        "UK": {
            "available": False,
            "brokers": [],
            "alternative": {
                "symbol": "VHYL.L",
                "name": "Vanguard FTSE All-World High Dividend Yield UCITS",
                "reason": "SCHD is US-only retail in practice — global high-dividend UCITS",
            },
        },
        "DE": {
            "available": False,
            "brokers": [],
            "alternative": {
                "symbol": "VHYL.DE",
                "name": "Vanguard FTSE All-World High Dividend Yield UCITS",
                "reason": "No SCHD under PRIIPs — high-dividend UCITS substitute",
            },
        },
        "PK": {"available": True, "brokers": ["ibkr"]},
        "AE": {"available": True, "brokers": ["ibkr"]},
        "CA": {
            "available": True,
            "brokers": ["questrade", "ibkr"],
            "alternative": {
                "symbol": "VDY.TO",
                "name": "Vanguard FTSE Canadian High Dividend Yield",
                "reason": "CAD dividend ETF if you prefer local listing",
            },
        },
        "AU": {
            "available": "limited",
            "brokers": ["ibkr"],
            "alternative": {
                "symbol": "VHY.AX",
                "name": "Vanguard Australian Shares High Yield ETF",
                "reason": "Local high-yield if SCHD is inconvenient",
            },
        },
        "IN": {"available": True, "brokers": ["ibkr", "vested"]},
        "SG": {"available": True, "brokers": ["ibkr", "tiger"]},
    },
    "BND": {
        "US": {"available": True, "brokers": ["fidelity", "schwab", "vanguard", "ibkr"]},
        "UK": {
            "available": False,
            "brokers": [],
            "alternative": {
                "symbol": "VAGP.L",
                "name": "Vanguard Global Bond UCITS (Hedged)",
                "reason": "US BND often unavailable — global aggregate UCITS bond ETF",
            },
        },
        "DE": {
            "available": False,
            "brokers": [],
            "alternative": {
                "symbol": "VAGE.DE",
                "name": "Vanguard Global Aggregate Bond UCITS",
                "reason": "PRIIPs — use UCITS global bond ETF instead of BND",
            },
        },
        "PK": {"available": True, "brokers": ["ibkr"]},
        "AE": {"available": True, "brokers": ["ibkr"]},
        "CA": {
            "available": True,
            "brokers": ["questrade", "ibkr"],
            "alternative": {
                "symbol": "ZAG.TO",
                "name": "BMO Aggregate Bond Index ETF",
                "reason": "CAD aggregate bond alternative",
            },
        },
        "AU": {
            "available": "limited",
            "brokers": ["ibkr"],
            "alternative": {
                "symbol": "VAF.AX",
                "name": "Vanguard Australian Fixed Interest ETF",
                "reason": "Local bond ETF alternative",
            },
        },
        "IN": {
            "available": "limited",
            "brokers": ["ibkr"],
            "alternative": {
                "symbol": "Liquid fund",
                "name": "India liquid / short-duration fund",
                "reason": "Domestic debt funds often simpler than BND under LRS",
            },
        },
        "SG": {"available": True, "brokers": ["ibkr", "fsmone"]},
    },
    "VXUS": {
        "US": {"available": True, "brokers": ["fidelity", "schwab", "vanguard", "ibkr"]},
        "UK": {
            "available": False,
            "brokers": [],
            "alternative": {
                "symbol": "VWRL.L",
                "name": "Vanguard FTSE All-World UCITS",
                "reason": "Global UCITS covers international exposure",
            },
        },
        "DE": {
            "available": False,
            "brokers": [],
            "alternative": {
                "symbol": "VWCE.DE",
                "name": "Vanguard FTSE All-World UCITS (Acc)",
                "reason": "PRIIPs — world UCITS instead of VXUS",
            },
        },
        "PK": {"available": True, "brokers": ["ibkr"]},
        "AE": {"available": True, "brokers": ["ibkr"]},
        "CA": {
            "available": True,
            "brokers": ["questrade", "ibkr"],
            "alternative": {
                "symbol": "VIU.TO",
                "name": "Vanguard FTSE Developed All Cap ex North America",
                "reason": "CAD international equity ETF",
            },
        },
        "AU": {"available": True, "brokers": ["ibkr"]},
        "IN": {"available": True, "brokers": ["ibkr", "vested"]},
        "SG": {"available": True, "brokers": ["ibkr", "tiger"]},
    },
    "VGT": {
        "US": {"available": True, "brokers": ["fidelity", "schwab", "vanguard", "ibkr"]},
        "UK": {
            "available": "limited",
            "brokers": ["ibkr"],
            "alternative": {
                "symbol": "IUIT.L",
                "name": "iShares S&P 500 Information Technology UCITS",
                "reason": "UCITS tech sector when VGT is restricted",
            },
        },
        "DE": {
            "available": False,
            "brokers": [],
            "alternative": {
                "symbol": "QDVE.DE",
                "name": "iShares S&P 500 Information Technology UCITS",
                "reason": "PRIIPs — tech UCITS instead of VGT",
            },
        },
        "PK": {"available": True, "brokers": ["ibkr"]},
        "AE": {"available": True, "brokers": ["ibkr"]},
        "CA": {"available": True, "brokers": ["questrade", "ibkr"]},
        "AU": {"available": True, "brokers": ["ibkr", "stake"]},
        "IN": {"available": True, "brokers": ["ibkr", "vested"]},
        "SG": {"available": True, "brokers": ["ibkr", "tiger"]},
    },
    "SMH": {
        "US": {"available": True, "brokers": ["fidelity", "schwab", "ibkr"]},
        "UK": {
            "available": "limited",
            "brokers": ["ibkr"],
            "alternative": {
                "symbol": "SMH.L",
                "name": "VanEck Semiconductor UCITS ETF",
                "reason": "UCITS semiconductor ETF listed in Europe",
            },
        },
        "DE": {
            "available": "limited",
            "brokers": ["ibkr"],
            "alternative": {
                "symbol": "SMH7.DE",
                "name": "VanEck Semiconductor UCITS ETF",
                "reason": "Prefer UCITS semi ETF on EU exchanges",
            },
        },
        "PK": {"available": True, "brokers": ["ibkr"]},
        "AE": {"available": True, "brokers": ["ibkr"]},
        "CA": {"available": True, "brokers": ["questrade", "ibkr"]},
        "AU": {"available": True, "brokers": ["ibkr"]},
        "IN": {"available": True, "brokers": ["ibkr", "vested"]},
        "SG": {"available": True, "brokers": ["ibkr", "tiger"]},
    },
    "HYSA": {
        "US": {
            "available": True,
            "brokers": ["fidelity", "schwab"],
            "note": "Bank HYSA or broker cash sweep — not a ticker",
        },
        "UK": {
            "available": True,
            "brokers": ["hl"],
            "note": "Easy-access / ISA cash — not a ticker",
            "alternative": {
                "symbol": "Cash ISA",
                "name": "UK cash ISA / easy-access savings",
                "reason": "Local regulated cash savings for the cash sleeve",
            },
        },
        "DE": {
            "available": True,
            "brokers": ["tr"],
            "note": "Tagesgeld / Trade Republic cash interest",
            "alternative": {
                "symbol": "Tagesgeld",
                "name": "EU overnight deposit (Tagesgeld)",
                "reason": "Local cash product instead of US HYSA",
            },
        },
        "PK": {
            "available": True,
            "brokers": ["local_psx"],
            "note": "Bank savings / T-bills / money-market funds",
            "alternative": {
                "symbol": "MMS / T-bills",
                "name": "PKR money-market or T-bills",
                "reason": "Local cash yield products; US HYSA needs offshore USD",
            },
        },
        "AE": {
            "available": True,
            "brokers": ["sarwa"],
            "note": "Bank savings / wakala deposits",
        },
        "CA": {
            "available": True,
            "brokers": ["wealthsimple", "questrade"],
            "alternative": {
                "symbol": "CASH.TO / PSA.TO",
                "name": "CAD cash / HISA ETF",
                "reason": "Common TFSA/RRSP cash sleeve alternatives",
            },
        },
        "AU": {
            "available": True,
            "brokers": ["commsec"],
            "note": "Bank HISA",
        },
        "IN": {
            "available": True,
            "brokers": [],
            "alternative": {
                "symbol": "Liquid fund",
                "name": "Liquid / arbitrage mutual fund",
                "reason": "Typical INR cash sleeve instead of US HYSA",
            },
        },
        "SG": {
            "available": True,
            "brokers": ["fsmone"],
            "note": "SGD / USD deposits or money-market funds",
        },
    },
}


def overnight_product(country_code: str) -> dict[str, str]:
    """Local overnight / cash product label for a country."""
    code = (country_code or "US").upper()
    access = (SYMBOL_ACCESS.get("HYSA") or {}).get(code) or {}
    alt = access.get("alternative") or {}
    if alt.get("symbol"):
        return {
            "symbol": alt["symbol"],
            "name": alt.get("name") or alt["symbol"],
        }
    country = COUNTRIES.get(code) or COUNTRIES["US"]
    return {
        "symbol": "HYSA" if code == "US" else "Cash",
        "name": country.get("savingsNote") or "Overnight / savings account",
    }


def list_countries() -> list[dict[str, Any]]:
    return [
        {
            "code": c["code"],
            "name": c["name"],
            "currency": c["currency"],
            "flag": c["flag"],
            "brokers": c["brokers"],
            "savingsNote": c["savingsNote"],
            "notes": c["notes"],
            "overnight": overnight_product(c["code"]),
        }
        for c in COUNTRIES.values()
    ]


def resolve_access(symbol: str, country_code: str) -> dict[str, Any]:
    code = (country_code or "US").upper()
    if code not in COUNTRIES:
        code = "US"

    country = COUNTRIES[code]
    broker_lookup = {b["id"]: b for b in country["brokers"]}

    entry = (SYMBOL_ACCESS.get(symbol) or {}).get(code)
    if not entry:
        # Default: assume IBKR-style international access if country has ibkr
        has_ibkr = "ibkr" in broker_lookup
        entry = {
            "available": True if has_ibkr else "limited",
            "brokers": ["ibkr"] if has_ibkr else [],
            "note": "Verify with your broker — not in our curated map.",
        }

    available = entry.get("available", False)
    broker_ids = entry.get("brokers") or []
    brokers = [
        {
            "id": bid,
            "name": broker_lookup[bid]["name"],
            "type": broker_lookup[bid]["type"],
        }
        for bid in broker_ids
        if bid in broker_lookup
    ]

    status = (
        "available"
        if available is True
        else "limited"
        if available == "limited"
        else "unavailable"
    )

    # Prefer symbol-specific note; avoid attaching country ETF boilerplate to every stock
    note = entry.get("note")
    if not note and not entry.get("alternative") and status != "available":
        note = country.get("notes")

    return {
        "country": code,
        "status": status,
        "available": available is True,
        "brokers": brokers,
        "alternative": entry.get("alternative"),
        "note": note,
    }
