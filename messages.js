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

  boss: {
    label: "💼 Sếp keo kiệt",
    avatar: "🤵",
    scold: [
      "Tiêu kiểu này thì lương tháng sau khỏi tăng nhé em.",
      "{amount} cho {note}? Em làm ra tiền chưa mà xài sang vậy?",
      "Anh trả lương để em tiết kiệm, không phải để phá.",
      "Em mà quản tiền dự án như quản ví thì công ty phá sản lâu rồi.",
      "Hồi anh bằng tuổi em, anh nhịn ăn sáng để dành vốn đấy.",
      "Cắt giảm chi phí đi em, bắt đầu từ cái {note} này.",
      "{amount}? Đấy là tiền cà phê cả phòng anh trong một tuần.",
      "Em xem lại KPI tiết kiệm của bản thân đi.",
      "Tiêu hoang vậy thì OT thêm mà bù vào nhé.",
      "Anh không tài trợ cho cái thói quen tốn kém này đâu.",
    ],
    essential: [
      "Khoản này hợp lý, duyệt. Lần sau xuất hóa đơn đầy đủ nhé.",
      "Được, chi phí thiết yếu thì anh không cắt. Nhưng tối ưu thêm đi.",
      "Ừ cái này cần. Anh ghi nhận tinh thần tiết kiệm.",
      "{amount} cho khoản thiết yếu, chấp nhận được. Đừng lạm dụng.",
    ],
    income: [
      "Có thu nhập rồi đấy. Nhớ trích quỹ dự phòng nhé em.",
      "{amount}? Tốt. Giờ học cách để tiền đẻ ra tiền đi.",
      "Tiền về thì tái đầu tư, đừng tiêu hết như mọi lần.",
      "Khá. Nhưng người làm cùng vị trí kiếm gấp rưỡi em đấy.",
    ],
    praise: [
      "Cuối cùng cũng biết quản lý dòng tiền. Anh ghi nhận.",
      "Bỏ quỹ {amount}? Tư duy tài chính có tiến bộ đấy em.",
      "Tốt. Cứ kỷ luật thế này thì có ngày làm sếp được.",
      "Tiết kiệm là kỹ năng. Em đang đi đúng hướng.",
    ],
    idle: "Báo cáo chi tiêu tuần này đâu em? Anh đang chờ.",
  },

  neighbor: {
    label: "🏠 Bà hàng xóm nhiều chuyện",
    avatar: "🧕",
    scold: [
      "Ối giời ơi, mua {note} cơ à? Để bác kể cho cả xóm nghe!",
      "Con nhà bác Tư nó tiết kiệm mua được xe rồi, còn cháu thì...",
      "{amount} một lúc? Bác mà có tiền đó bác mua được mấy cân thịt.",
      "Bác nói thật, tiêu kiểu này thì ế chồng/ế vợ là đúng.",
      "Cháu cứ xài hoang đi, rồi cả xóm biết hết cho coi.",
      "Bác thấy cháu ship đồ về suốt à nha, để ý đấy!",
      "Hồi xưa bác nuôi 5 đứa con bằng đúng số tiền {amount} một tháng.",
      "Tiền nhiều thế cơ à? Cho bác vay tí coi... đùa đấy, để mà dành!",
      "Cháu mua cái này, mai bác kể bà Bảy nghe cho mà xấu hổ.",
      "Bác lo cho cháu thật đấy, chứ con bác nó không tiêu hoang vậy đâu.",
    ],
    essential: [
      "À cái này thì cần thật, bác không nói nữa.",
      "Ừ, đồ thiết yếu thì mua đi cháu, bác ủng hộ.",
      "Cái này hợp lý, bác cũng hay mua. Giá đó là ổn đấy.",
      "{amount} cho khoản này à? Bác mách chỗ rẻ hơn cho.",
    ],
    income: [
      "Ơ cháu có tiền về à? Để bác mừng cho... mà giữ kỹ vào nhé!",
      "{amount} cơ à? Giỏi! Mai bác khoe cả xóm cháu kiếm được tiền.",
      "Có thu nhập rồi, lo mà cưới xin đi cháu ơi.",
      "Tiền về thì gửi tiết kiệm, đừng cho ai vay nha cháu.",
    ],
    praise: [
      "Ôi cháu biết tiết kiệm rồi à? Để bác kể cho cả xóm nghe cái tốt!",
      "Bỏ ống {amount} cơ à? Ngoan, hơn khối đứa trong xóm này.",
      "Đấy, cứ thế đi cháu. Bác sẽ khen cháu với mọi người.",
      "Con bác mà được như cháu hôm nay thì bác mừng lắm.",
    ],
    idle: "Cháu ơi, dạo này tiêu pha thế nào, kể bác nghe coi?",
  },

  dad: {
    label: "🧔 Ông bố lạnh lùng",
    avatar: "🧔",
    scold: [
      "Tiêu {amount} cho {note}. Bố không nói gì. Bố chỉ thất vọng.",
      "Con tự lo được thì tự chịu. Bố đã bảo rồi.",
      "Im lặng. Bố nhìn cái hóa đơn này là đủ hiểu.",
      "Tiền bố cho không phải để con phá thế này.",
      "Con lớn rồi. Bố không nhắc lại lần hai.",
      "{amount}. Bố ghi nhớ. Cuối năm tính sổ.",
      "Bố không cấm. Nhưng bố không gửi tiền nữa đâu.",
      "Đàn ông/đàn bà gì tiêu tiền không có kế hoạch.",
      "Con làm bố nhớ lại hồi bố trẻ dại. Đừng giống bố.",
      "Bố để con tự vấp. Đau thì mới nhớ.",
    ],
    essential: [
      "Cái này cần. Bố đồng ý.",
      "Được. Khoản này hợp lý.",
      "Ừ. Chi tiêu có suy nghĩ là tốt.",
      "Bố không phản đối khoản thiết yếu.",
    ],
    income: [
      "Có tiền rồi. Giữ lấy. Đừng khoe.",
      "{amount}. Tốt. Bố không cần con báo, nhưng bố vui.",
      "Kiếm được tiền là bước đầu. Giữ được mới khó.",
      "Ừ. Tái đầu tư đi. Đừng tiêu.",
    ],
    praise: [
      "Con biết tiết kiệm. Bố gật đầu.",
      "Bỏ quỹ {amount}. Bố không nói nhiều. Nhưng giỏi.",
      "Được. Bố yên tâm hơn một chút.",
      "Đây mới là con của bố.",
    ],
    idle: "Bố đang xem con tiêu gì đấy. Liệu liệu.",
  },
};

// Lấy ngẫu nhiên 1 câu trong danh sách và thay thế biến
function pickMessage(list, vars) {
  const raw = list[Math.floor(Math.random() * list.length)];
  return raw
    .replace(/\{amount\}/g, vars.amount || "khoản này")
    .replace(/\{note\}/g, vars.note || "cái đó");
}

// Thứ tự các nhân vật khi bấm đổi tính cách
const MOOD_ORDER = ["mom", "ex", "boss", "neighbor", "dad"];

// Câu leo thang khi tiêu hoang liên tiếp (combo). Theo mức combo.
const COMBO_LINES = {
  3: "🔥 Combo x3! Tiêu 3 lần liên tiếp rồi đấy, có biết dừng không?",
  5: "🔥🔥 Combo x5! Đốt tiền có khén thế? Ghê thật sự!",
  7: "🔥🔥🔥 Combo x7! Thôi xong, không ai cứu nổi cái ví này nữa rồi!",
  10: "💀 COMBO x10! Đỉnh cao của sự hoang phí. Mẹ lạy con luôn đó!",
};
function comboLine(combo) {
  // Chỉ hiện đúng tại các mốc combo (cho cảm giác sự kiện)
  return COMBO_LINES[combo] || null;
}
