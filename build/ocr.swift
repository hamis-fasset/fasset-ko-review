import Foundation
import Vision
import AppKit

// usage: ocr <out.json> <image paths...>
let args = CommandLine.arguments
let outPath = args[1]
var results: [String: Any] = [:]
for path in args.dropFirst(2) {
    guard let img = NSImage(contentsOfFile: path), let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { continue }
    let w = cg.width, h = cg.height
    let req = VNRecognizeTextRequest()
    req.recognitionLevel = .accurate
    req.usesLanguageCorrection = true
    req.recognitionLanguages = ["en-US"]
    let handler = VNImageRequestHandler(cgImage: cg, options: [:])
    try? handler.perform([req])
    var lines: [[String: Any]] = []
    for obs in req.results ?? [] {
        guard let top = obs.topCandidates(1).first else { continue }
        let b = obs.boundingBox // normalized, origin bottom-left
        let x = b.origin.x * CGFloat(w), y = (1 - b.origin.y - b.height) * CGFloat(h)
        lines.append(["text": top.string, "conf": top.confidence, "x": Int(x), "y": Int(y), "w": Int(b.width * CGFloat(w)), "h": Int(b.height * CGFloat(h))])
    }
    results[(path as NSString).lastPathComponent] = ["w": w, "h": h, "lines": lines]
}
let data = try JSONSerialization.data(withJSONObject: results, options: [.prettyPrinted])
try data.write(to: URL(fileURLWithPath: outPath))
print("ok", results.count)
