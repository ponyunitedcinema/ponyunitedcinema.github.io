// All of this depends on KissProxy touching a video's webpage on BOTH services first (cookies and other things are set there) or else the RSK value will be bogus!

// KissAsian: $kissenc_kissasian_init(window); is called at service init time
function $kissenc_kissasian_init(b, funcCallback) {
	var g, a, d = "32b812e9a1321ae0e84af660c4722b3a";

	function f() {
		g = CryptoJS["enc"]["Hex"]["parse"](d);
		var b = $["ajax"]({
			url: "http://kissasian.yukitheater.org/External/RSK",
			type: "POST",
			//async: !1,
			timeout: 15000,
			success: function(b) {
				a = CryptoJS["SHA256"](b);
				funcCallback();
			}
		});
	}

	f["prototype"]["decrypt"] = function(b) {
		var f = null;
		try {
			var d = CryptoJS["lib"]["CipherParams"]["create"]({
					ciphertext: CryptoJS["enc"]["Base64"]["parse"](b)
				}),
				h = CryptoJS["AES"]["decrypt"](d, a, {
					mode: CryptoJS["mode"]["CBC"],
					iv: g,
					padding: CryptoJS["pad"]["Pkcs7"]
				});
			return f = h["toString"](CryptoJS["enc"]["Utf8"])
		} catch (c) {
			return ""
		}
	}, b["$kissenc_kissasian"] = new f
};

// KissCartoon: $kissenc_kisscartoon_init(window); is called at service init time
function $kissenc_kisscartoon_init(b, funcCallback) {
	var g, a, d = "a5e8d2e9c1721ae0e84ad660c472c1f3";

	function f() {
		g = CryptoJS["enc"]["Hex"]["parse"](d);
		var b = $["ajax"]({
			url: "http://kisscartoon.yukitheater.org/External/RSK",
			type: "POST",
			//async: !1,
			timeout: 15000,
			success: function(b) {
				a = CryptoJS["SHA256"](b);
				funcCallback();
			}
		});
	}

	f["prototype"]["decrypt"] = function(b) {
		var f = null;
		try {
			var d = CryptoJS["lib"]["CipherParams"]["create"]({
					ciphertext: CryptoJS["enc"]["Base64"]["parse"](b)
				}),
				h = CryptoJS["AES"]["decrypt"](d, a, {
					mode: CryptoJS["mode"]["CBC"],
					iv: g,
					padding: CryptoJS["pad"]["Pkcs7"]
				});
			return f = h["toString"](CryptoJS["enc"]["Utf8"])
		} catch (c) {
			return ""
		}
	}, b["$kissenc_kisscartoon"] = new f
};

