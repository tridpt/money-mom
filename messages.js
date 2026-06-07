// =====================================================================
// Kho câu thoại của "Mẹ Thiên Hạ"
// 2 tính cách: "mom" (mẹ nghiêm khắc) và "ex" (người yêu cũ thực dụng)
// =====================================================================

const MESSAGES = {
  mom: {
    label: "😤 Mẹ nghiêm khắc",
    avatar: "👩‍🦰",
    // Chi tiêu KHÔNG thiết yếu -> mắng
    scold: [
      "Lương ba cọc ba đồng mà tiêu như chủ tịch tập đoàn vậy con?",
      "Uống đi, ăn đi, rồi cuối tháng cạp đất mà sống nha con.",
      "Tiền không phải lá mít mà con xài kiểu này hả?",
      "Bằng tuổi con người ta mua nhà, còn con mua {note}.",
      "Mẹ làm lụng cả đời, con tiêu một nốt nhạc. Giỏi!",
      "{amount} cho cái khoản này á? Mẹ xỉu ngang.",
      "Con tưởng tiền tự mọc trong ví hả con ơi?",
      "Mai mốt đói đừng có gọi điện về cho mẹ nha.",
      "Nhìn cái ví con mà mẹ thấy tương lai con xám xịt luôn á.",
      "Người ta tiết kiệm mua vàng, con tiết kiệm mua nợ.",
      "{note} mà cũng đòi mua, đúng là con của mẹ... mẹ buồn.",
      "Hôm nay {amount}, ngày mai {amount}, mốt ra đê ở nha con.",
    ],
    // Chi tiêu THIẾT YẾU -> càu nhàu nhẹ
    essential: [
      "Thôi khoản này thì cho qua, nhưng lần sau xem có rẻ hơn không.",
      "Cũng được, đồ thiết yếu mà. Nhưng đừng có lấy cớ nha con.",
      "Ừ, cái này cần thật. Mẹ tha. Lần này thôi đấy.",
      "Thiết yếu thì thiết yếu, nhưng {amount} là hơi chát đó con.",
      "Được, mẹ duyệt. Nhưng mẹ vẫn nhớ con tiêu bao nhiêu đấy nhé.",
    ],
    // Thu nhập -> động viên kiểu mẹ
    income: [
      "Ờ, có tiền về rồi đấy. Giữ cho kỹ vào, đừng có vung tay.",
      "{amount}? Khá lắm. Nhưng đừng có thấy tiền là máu tham nổi lên nha.",
      "Tiền về tay mẹ là yên tâm, mà tay con thì mẹ lo.",
      "Có tiền rồi nhớ gửi heo đất, đừng nướng hết vào trà sữa.",
      "Giỏi, biết kiếm tiền rồi đấy. Giờ học cách giữ tiền nữa con.",
    ],
    // Tiết kiệm -> khen mỉa mai
    praise: [
      "Ồ, hôm nay cũng biết nghĩ cho tương lai rồi cơ à?",
      "Trời ơi, con của mẹ biết tiết kiệm? Mẹ tưởng mẹ nằm mơ.",
      "Được đấy. Cứ đà này mẹ đỡ phải lo con ra đê.",
      "Bỏ ống được {amount} cơ á? Mẹ xúc động muốn khóc.",
      "Cuối cùng cũng có ngày này. Mẹ tự hào... một chút thôi.",
      "Tiết kiệm đi con, để mai mốt còn nuôi mẹ lúc về già.",
      "Ngoan. Lần đầu mẹ thấy con khôn ra đấy.",
    ],
    idle: "Tiền đâu? Khai báo chi tiêu ngay, để mẹ còn liệu mà la...",
  },

  ex: {
    label: "💔 Người yêu cũ thực dụng",
    avatar: "💅",
    scold: [
      "Hồi yêu em anh cũng tiêu kiểu này, giờ vẫn nghèo. Trùng hợp ha.",
      "Mua {note} á? Bảo sao hồi đó em bỏ là đúng.",
      "{amount} cho cái này? Thảo nào ví lúc nào cũng rỗng như lời hứa của anh.",
      "Người mới của em ảnh đầu tư chứng khoán, còn anh thì đầu tư trà sữa.",
      "Tiêu tiền giỏi ghê. Tiếc là hồi đó không tiêu vào em.",
      "Anh nghèo bền vững thật đấy, em phục.",
      "Khoản này à? Đúng gu tiêu hoang ngày xưa của anh luôn.",
      "Em đi xa rồi mà thói tiêu xài của anh vẫn ở lại. Buồn ha.",
      "{amount}... bằng đúng số tiền anh nợ em hồi đó đấy.",
      "Thôi cứ tiêu đi, dù sao giờ cũng đâu phải lo cho ai.",
    ],
    essential: [
      "Khoản này thì hợp lý. Hiếm khi anh khôn được vậy.",
      "Ừ cái này cần thật. Lần đầu thấy anh tiêu có não đấy.",
      "Thiết yếu thì em không nói. Nhưng {amount} hơi sang so với anh.",
      "Được, lần này em duyệt. Đừng quen nha.",
    ],
    income: [
      "Có tiền rồi đấy. Tiếc là chậm vài năm so với lúc em cần.",
      "{amount} hả? Giờ mới kiếm được, hồi đó thì sao không cố?",
      "Tiền về rồi, nhớ giữ. Đừng để nó đi như em đã đi.",
      "Khá đấy. Mà người ta kiếm gấp đôi anh cơ.",
    ],
    praise: [
      "Ơ, biết tiết kiệm rồi à? Giờ thì hơi muộn rồi anh ơi.",
      "Bỏ heo đất {amount}? Hồi yêu em mà được vậy thì đã khác.",
      "Trưởng thành ghê. Tiếc là em không còn ở đó để thấy.",
      "Ồ, biết lo cho tương lai. Tương lai không có em, nhưng vẫn đáng khen.",
      "Giỏi đấy. Người mới của em chắc cũng tiết kiệm như anh bây giờ.",
    ],
    idle: "Lâu rồi không gặp. Nghe nói dạo này vẫn tiêu hoang à?",
  },
};

// Lấy ngẫu nhiên 1 câu trong danh sách và thay thế biến
function pickMessage(list, vars) {
  const raw = list[Math.floor(Math.random() * list.length)];
  return raw
    .replace(/\{amount\}/g, vars.amount || "khoản này")
    .replace(/\{note\}/g, vars.note || "cái đó");
}
