import Foundation
import Vision
import AppKit

// Produces precise per-token boxes so the browser can replace words without
// painting over adjacent icons, badges, values, or controls.
// usage: swift refine-ocr.swift <out.json> <image paths...>

let args = CommandLine.arguments
guard args.count >= 3 else {
    fputs("usage: refine-ocr.swift <out.json> <image paths...>\n", stderr)
    exit(2)
}

func pixelRect(_ box: CGRect, width: Int, height: Int) -> [String: Int] {
    let x = box.origin.x * CGFloat(width)
    let y = (1 - box.origin.y - box.height) * CGFloat(height)
    return [
        "x": Int(x.rounded(.down)),
        "y": Int(y.rounded(.down)),
        "w": Int((box.width * CGFloat(width)).rounded(.up)),
        "h": Int((box.height * CGFloat(height)).rounded(.up))
    ]
}

let outputPath = args[1]
var output: [String: Any] = [:]

for path in args.dropFirst(2) {
    guard
        let image = NSImage(contentsOfFile: path),
        let cg = image.cgImage(forProposedRect: nil, context: nil, hints: nil)
    else { continue }

    let width = cg.width
    let height = cg.height
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = true
    request.recognitionLanguages = ["en-US"]
    try VNImageRequestHandler(cgImage: cg, options: [:]).perform([request])

    var lines: [[String: Any]] = []
    for observation in request.results ?? [] {
        guard let candidate = observation.topCandidates(1).first else { continue }
        let text = candidate.string
        let nsText = text as NSString
        let regex = try NSRegularExpression(pattern: "\\S+")
        var tokens: [[String: Any]] = []

        for match in regex.matches(in: text, range: NSRange(location: 0, length: nsText.length)) {
            guard let range = Range(match.range, in: text) else { continue }
            guard let tokenObservation = try? candidate.boundingBox(for: range) else { continue }
            var token: [String: Any] = pixelRect(tokenObservation.boundingBox, width: width, height: height)
            token["text"] = nsText.substring(with: match.range)
            token["start"] = match.range.location
            token["end"] = match.range.location + match.range.length
            tokens.append(token)
        }

        var line: [String: Any] = pixelRect(observation.boundingBox, width: width, height: height)
        line["text"] = text
        line["confidence"] = candidate.confidence
        line["tokens"] = tokens
        lines.append(line)
    }

    output[(path as NSString).lastPathComponent] = [
        "width": width,
        "height": height,
        "lines": lines
    ]
}

let data = try JSONSerialization.data(withJSONObject: output, options: [.prettyPrinted, .sortedKeys])
try data.write(to: URL(fileURLWithPath: outputPath))
print("OCR refined for \(output.count) images")
