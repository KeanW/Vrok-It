# Vrok-It
_View and collaborate on 3D models inside Virtual Reality using Autodesk's Forge platform._

## What does Vrok mean?
"Vrok" is a combination of Virtual Reality Online Collaboration and the verb to grok. Vrok-it allows multiple people to grok a 3D model in a way that simply wasn’t possible before.

## Origins
Vrok-it was born in May 2015, when three software engineers from Autodesk entered a team in the VR Hackathon in San Francisco. The goal of the "VR Party" team was to enable a guide to assist someone immersed in virtual reality, essentially curating the VR experience. The guide would perform actions that the VR participant might otherwise find cumbersome, such as exploding a 3D model, zooming in on it, or cutting it with a section plane. Making VR more personal and social makes it an ideal tool for communicating design information, for architectural fly-throughs, site walk-throughs and model review.

The team soon realized it would be easy to allow the guide to curate the VR experience for multiple participants, much in the same way as proposed by Google Expeditions, announced just the week after at Google I/O 2015.

The project was well-received and was awarded the Hackathon prize for the "Best Web-based VR Project".

Over the following weeks the team implemented additional features, such as making it possible for people to create and manage simultaneous sessions. When launched "VR Party" became Vrok-it.

## How to use Vrok-It?
On your "master" system - typically a PC or tablet - head on over to http://vrok.it (or http://www.vrok.it/v2 for the experimental, single-viewer version).
Click the QR code – or scan it from your phone – to launch a stereoscopic 3D viewer (typically on a secondary device, such as a Google Cardboard-ready smartphone) connected to this session. The 3D models you load via the master page – and operations you perform on them – will be visible to all connected viewers. You can upload your own models, but for best results keep these under 2MB in size.

## Technology
At its core, the project makes use of Autodesk's Forge platform, a web-based infrastructure that can be used for viewing 3D models, and leverages work previously published on Kean's blog. It has a Node.js back-end, with Socket.io handling the communication between presenter and participants. The site is hosted on Heroku and the complete source code for Vrok-it is available in this repository on GitHub.

## Supporting links

Here are some blog posts tracking the evolution of Vrok-It:

* [Cooling down after the SF VR Hackathon] (http://through-the-interface.typepad.com/through_the_interface/2015/05/cooling-down-after-the-sf-vr-hackathon.html)
* [Our collaborative VR demo from the recent Hackathon] (http://through-the-interface.typepad.com/through_the_interface/2015/06/our-collaborative-vr-demo-from-the-recent-hackathon.html)
* [A fun, collaborative VR tool: can you Vrok-it?] (http://through-the-interface.typepad.com/through_the_interface/2015/06/a-fun-collaborative-vr-tool-can-you-vrok-it.html)
* [WebVR in Chrome and Forge] (http://through-the-interface.typepad.com/through_the_interface/2017/02/webvr-in-chrome-and-forge.html)

The project built on work done previously related to using the Forge viewer for VR:

* [Gearing up for the VR Hackathon] (http://through-the-interface.typepad.com/through_the_interface/2014/10/gearing-up-for-the-vr-hackathon.html)
* [Creating a stereoscopic viewer for Google Cardboard using the Autodesk 360 viewer - Part 1] (http://through-the-interface.typepad.com/through_the_interface/2014/10/creating-a-stereoscopic-viewer-for-google-cardboard-using-the-autodesk-360-viewer-part-1.html)
* [Creating a stereoscopic viewer for Google Cardboard using the Autodesk 360 viewer - Part 2] (http://through-the-interface.typepad.com/through_the_interface/2014/10/creating-a-stereoscopic-viewer-for-google-cardboard-using-the-autodesk-360-viewer-part-2.html)
* [Creating a stereoscopic viewer for Google Cardboard using the Autodesk 360 viewer - Part 3] (http://through-the-interface.typepad.com/through_the_interface/2014/10/creating-a-stereoscopic-viewer-for-google-cardboard-using-the-autodesk-360-viewer-part-3.html)

